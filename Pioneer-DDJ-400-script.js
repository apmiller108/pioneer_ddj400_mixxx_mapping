// This is a 4-deck controller mapping for the Pioneer DDJ-400 to work with
// Mixxx DJ software. It is based on the 2-deck controller mapping:
// https://github.com/mixxxdj/mixxx/blob/main/res/controllers/Pioneer-DDJ-400-script.js.
// See notes for original 2-deck mapping below.
//
// Authors: apmiller108
//
// ORIGINAL NOTES FOR 2-DECK CONTROLLER MAPPING
//
// Pioneer-DDJ-400-script.js
//
// ****************************************************************************
// * Mixxx mapping script file for the Pioneer DDJ-400.
// * Authors: Warker, nschloe, dj3730, jusko
// * Reviewers: Be-ing, Holzhaus
// * Manual: https://manual.mixxx.org/2.3/en/hardware/controllers/pioneer_ddj_400.html
// ****************************************************************************
//
//  Implemented (as per manufacturer's manual):
//      * Mixer Section (Faders, EQ, Filter, Gain, Cue)
//      * Browsing and loading + Waveform zoom (shift)
//      * Jogwheels, Scratching, Bending, Loop adjust
//      * Cycle Temporange
//      * Beat Sync
//      * Hot Cue Mode
//      * Beat Loop Mode
//      * Beat Jump Mode
//      * Sampler Mode
//
//  Custom (Mixxx specific mappings):
//      * BeatFX: Assigned Effect Unit 1
//                < LEFT focus EFFECT1
//                > RIGHT focus EFFECT2
//                v FX_SELECT focus EFFECT3.
//                ON/OFF toggles focused effect slot
//                SHIFT + ON/OFF disables all three effect slots.
//                SHIFT + < loads previous effect
//                SHIFT + > loads next effect
//
//      * 32 beat jump forward & back (Shift + </> CUE/LOOP CALL arrows)
//      * Toggle quantize (Shift + channel cue)
//
//  Not implemented (after discussion and trial attempts):
//      * Loop Section:
//        * -4BEAT auto loop (hacky---prefer a clean way to set a 4 beat loop
//                            from a previous position on long press)
//
//        * CUE/LOOP CALL - memory & delete (complex and not useful. Hot cues are sufficient)
//
//      * Secondary pad modes (trial attempts complex and too experimental)
//        * Keyboard mode
//        * Pad FX1
//        * Pad FX2
//        * Keyshift mode

var PioneerDDJ400 = {};

PioneerDDJ400.lights = {
    beatFx: {
        status: 0x94,
        data1: 0x47,
    },
    shiftBeatFx: {
        status: 0x94,
        data1: 0x43,
    },
    '[Channel1]': {
        vuMeter: {
            status: 0xB0,
            data1: 0x02,
        },
        pfl: {
            status: 0x90,
            data1: 0x54
        },
        playPause: {
            status: 0x90,
            data1: 0x0B,
        },
        shiftPlayPause: {
            status: 0x90,
            data1: 0x47,
        },
        cue: {
            status: 0x90,
            data1: 0x0C,
        },
        shiftCue: {
            status: 0x90,
            data1: 0x48,
        },
        beatSync: {
            status: 0x90,
            midinos: [0x58, 0x60]
        },
        hotcuePad: function(padNum) {
            var status = PioneerDDJ400.shiftButtonDown[0] ? 0x98 : 0x97;
            var data1 = 0x00 + (padNum - 1);
            return { status: status, data1: data1 };
        },
        beatLoopPad: function(padNum) {
            var data1 = 0x60 + (padNum - 1);
            return { status: 0x97, data1: data1 };
        }
    },
    '[Channel2]': {
        vuMeter: {
            status: 0xB0,
            data1: 0x02,
        },
        pfl: {
            status: 0x91,
            data1: 0x54
        },
        playPause: {
            status: 0x91,
            data1: 0x0B,
        },
        shiftPlayPause: {
            status: 0x91,
            data1: 0x47,
        },
        cue: {
            status: 0x91,
            data1: 0x0C,
        },
        shiftCue: {
            status: 0x91,
            data1: 0x48,
        },
        beatSync: {
            status: 0x91,
            midinos: [0x58, 0x60]
        },
        hotcuePad: function(padNum) {
            var status = PioneerDDJ400.shiftButtonDown[1] ? 0x9A : 0x99;
            var data1 = 0x00 + (padNum - 1);
            return { status: status, data1: data1 };
        },
        beatLoopPad: function(padNum) {
            var data1 = 0x60 + (padNum - 1);
            return { status: 0x99, data1: data1 };
        }
    }
};

// Copy Channel lights to their respective toggle channels
PioneerDDJ400.lights['[Channel3]'] = PioneerDDJ400.lights['[Channel1]'];
PioneerDDJ400.lights['[Channel4]'] = PioneerDDJ400.lights['[Channel2]'];

// Just a list of channels to loop over as needed.
PioneerDDJ400.channels = [
    '[Channel1]',
    '[Channel2]',
    '[Channel3]',
    '[Channel4]',
];

// This is to faciliate 4 deck control. It maps the controller channel to the
// virtual channel it has been toggled to control. For example, controller deck
// 1 (ie, [Channel1]) can also control [Channel3] when toggled (See toggleDeck
// below). And controller deck 2 can control [Channel4].
PioneerDDJ400.groups = {
    '[Channel1]': '[Channel1]',
    '[Channel2]': '[Channel2]',
    '[EqualizerRack1_[Channel1]_Effect1]': '[EqualizerRack1_[Channel1]_Effect1]',
    '[EqualizerRack1_[Channel2]_Effect1]': '[EqualizerRack1_[Channel2]_Effect1]',
    '[QuickEffectRack1_[Channel1]]': '[QuickEffectRack1_[Channel1]]',
    '[QuickEffectRack1_[Channel2]]': '[QuickEffectRack1_[Channel2]]',
};

// Store timer IDs
PioneerDDJ400.timers = {};

// Jog wheel constants
PioneerDDJ400.vinylMode = true;
PioneerDDJ400.alpha = 1.0/8;
PioneerDDJ400.beta = PioneerDDJ400.alpha/32;

// Multiplier for fast seek through track using SHIFT+JOGWHEEL
PioneerDDJ400.fastSeekScale = 150;
PioneerDDJ400.bendScale = 0.8;

PioneerDDJ400.tempoRanges = [0.06, 0.10, 0.16, 0.25];

PioneerDDJ400.shiftButtonDown = [false, false];

// Jog wheel loop adjust
PioneerDDJ400.loopAdjustIn = [false, false, false, false];
PioneerDDJ400.loopAdjustOut = [false, false, false, false];
PioneerDDJ400.loopAdjustMultiply = 50;

// Beatjump pad (beatjump_size values)
PioneerDDJ400.beatjumpSizeForPad = {
    0x20: -1, // PAD 1
    0x21: 1,  // PAD 2
    0x22: -2, // PAD 3
    0x23: 2,  // PAD 4
    0x24: -4, // PAD 5
    0x25: 4,  // PAD 6
    0x26: -8, // PAD 7
    0x27: 8   // PAD 8
};

PioneerDDJ400.quickJumpSize = 32;

// Used for tempo slider, volume faders, and effects parameters
PioneerDDJ400.highResMSB = {
    "[Channel1]": {},
    "[Channel2]": {},
    "[Channel3]": {},
    "[Channel4]": {},
    "[EqualizerRack1_[Channel1]_Effect1]": {},
    "[EqualizerRack1_[Channel2]_Effect1]": {},
    "[EqualizerRack1_[Channel3]_Effect1]": {},
    "[EqualizerRack1_[Channel4]_Effect1]": {}
};

//
// Helper Functions
//

PioneerDDJ400.activeDeckForGroup = function(group) {
    return _.find(_.keys(PioneerDDJ400.groups), function(key) {
        return PioneerDDJ400.groups[key] === group;
    });
};

PioneerDDJ400.deckNumberFromGroup = function(group) {
    return parseInt(script.channelRegEx.exec(PioneerDDJ400.groups[group])[1]);
};

PioneerDDJ400.channelIndex = function(group) {
    return parseInt(script.channelRegEx.exec(group)[1]) - 1;
};

// Based on https://github.com/mixxxdj/mixxx/blob/main/src/controllers/midi/midicontroller.cpp#L316-L336
PioneerDDJ400.combineMsbLsb = function(msb, lsb) {
    var combinedValue = (msb << 7) + lsb;
    return Math.min((combinedValue / 0x80), 127);
};


PioneerDDJ400.toggleLight = function(midiIn, active) {
    print(midiIn.status);
    print(midiIn.data1);
    midi.sendShortMsg(midiIn.status, midiIn.data1, active ? 0x7F : 0);
};

//
// Callbacks
//

PioneerDDJ400.onTrackLoaded = function(value, group, control) {
    var activeDeck = PioneerDDJ400.activeDeckForGroup(group);
    if (activeDeck) {
        PioneerDDJ400.trackLoadedLED(value, activeDeck, control);
        PioneerDDJ400.initDeck(group);
    }
};

PioneerDDJ400.trackLoadedLED = function(value, group) {
    midi.sendShortMsg(
        0x9F,
        group.match(script.channelRegEx)[1] - 1,
        value > 0 ? 0x7F : 0x00
    );
};

PioneerDDJ400.onEject = function(_value, group) {
    var activeDeck = PioneerDDJ400.activeDeckForGroup(group);
    if (activeDeck) {
        PioneerDDJ400.initDeck(group);
    }
};

PioneerDDJ400.onLoopEnabled = function(value, group, control) {
    var activeDeck = PioneerDDJ400.activeDeckForGroup(group);
    PioneerDDJ400.loopToggle(value, activeDeck, control);
};

PioneerDDJ400.onPlay = function(value, group) {
    var light = PioneerDDJ400.lights[group].playPause;
    PioneerDDJ400.toggleLight(light, !!value);
};

PioneerDDJ400.onCueIndicator = function(value, group) {
    var light = PioneerDDJ400.lights[group].cue;
    PioneerDDJ400.toggleLight(light, value);
};

//
// Init
//

PioneerDDJ400.init = function() {
    // VuMeter
    engine.makeConnection("[Channel1]", "VuMeter", PioneerDDJ400.vuMeterUpdate);
    engine.makeConnection("[Channel2]", "VuMeter", PioneerDDJ400.vuMeterUpdate);

    PioneerDDJ400.toggleLight(PioneerDDJ400.lights['[Channel1]'].vuMeter, false);
    PioneerDDJ400.toggleLight(PioneerDDJ400.lights['[Channel2]'].vuMeter, false);

    // EffectRack
    engine.setValue("[EffectRack1_EffectUnit1]", "show_focus", 1);

    engine.softTakeover("[EffectRack1_EffectUnit1_Effect1]", "meta", true);
    engine.softTakeover("[EffectRack1_EffectUnit1_Effect2]", "meta", true);
    engine.softTakeover("[EffectRack1_EffectUnit1_Effect3]", "meta", true);
    engine.softTakeover("[EffectRack1_EffectUnit1]", "mix", true);

    for (var i = 1; i <= 3; i++) {
        engine.makeConnection("[EffectRack1_EffectUnit1_Effect" + i +"]", "enabled", PioneerDDJ400.toggleFxLight);
    }
    engine.makeConnection("[EffectRack1_EffectUnit1]", "focused_effect", PioneerDDJ400.toggleFxLight);

    // Sampler
    for (var i = 1; i <= 16; ++i) {
        engine.makeConnection("[Sampler" + i + "]", "play", PioneerDDJ400.samplerPlayOutputCallbackFunction);
    }

    // Loop over channels and setup connection callbacks, etc.
    PioneerDDJ400.channels.forEach(function(channel) {
        engine.softTakeover(channel, "rate", true);
        engine.makeConnection(channel, "track_loaded", PioneerDDJ400.onTrackLoaded);
        engine.makeConnection(channel, "eject", PioneerDDJ400.onEject);
        engine.makeConnection(channel, "loop_enabled", PioneerDDJ400.onLoopEnabled);
        engine.makeConnection(channel, "play", PioneerDDJ400.onPlay);
        engine.makeConnection(channel, "cue_indicator", PioneerDDJ400.onCueIndicator);
    });

    // play the "track loaded" animation on both decks at startup
    midi.sendShortMsg(0x9F, 0x00, 0x7F);
    midi.sendShortMsg(0x9F, 0x01, 0x7F);

    PioneerDDJ400.setLoopButtonLights(0x90, 0x7F);
    PioneerDDJ400.setLoopButtonLights(0x91, 0x7F);

    // query the controller for current control positions on startup
    midi.sendSysexMsg([0xF0, 0x00, 0x40, 0x05, 0x00, 0x00, 0x02, 0x06, 0x00, 0x03, 0x01, 0xf7], 12);

    // Initialize hotcue and beatloop pads
    for (var i = 1; i <= 8; i++) {
        PioneerDDJ400['hotcue' + i + 'Activate'] = PioneerDDJ400.hotcuePadFunction('hotcue_' + i + '_activate', i);
        PioneerDDJ400['hotcue' + i + 'Clear'] = PioneerDDJ400.hotcuePadFunction('hotcue_' + i + '_clear', i);

        var loopLength = PioneerDDJ400.beatLoopPadLoopLengths[i - 1];
        PioneerDDJ400['beatloop' + loopLength.replace('.', '') + 'Toggle']
            = PioneerDDJ400.beatLoopPadFunction('beatloop_' + loopLength + '_toggle', i);
    }
};

//
// Toggle deck (BEATSYNC +SHIFT)
//
PioneerDDJ400.toggleDeck = function(channel, control, value, status, group) {
    if (value === 127) {
        var deckNumber = PioneerDDJ400.deckNumberFromGroup(group); // A number in the range of 1..4
        var newDeckNumber;

        if (deckNumber <= 2) {
            newDeckNumber = deckNumber + 2;
        } else {
            newDeckNumber = deckNumber - 2;
        }

        var newChannel = '[Channel' + newDeckNumber + ']';
        PioneerDDJ400.groups[group] = newChannel;

        // Also toggle parameter effects to operate on new channel
        var effectGroup = '[EqualizerRack1_' + group + '_Effect1]';
        var newEffectGroup = '[EqualizerRack1_' + newChannel + '_Effect1]';
        PioneerDDJ400.groups[effectGroup] = newEffectGroup;

        PioneerDDJ400.initDeck(newChannel);
    }
};

PioneerDDJ400.initDeck = function(group) {
    var deckToggleLight = PioneerDDJ400.lights[group].beatSync;
    var deckNumber = group.match(script.channelRegEx)[1];

    // BEAT SYNC is lit for deck 1 when deck 3 is active and for deck 2 when
    // deck 4 is active.
    deckToggleLight.midinos.forEach(function(midino) {
        midi.sendShortMsg(
            deckToggleLight.status,
            midino,
            deckNumber > 2 ? 0x7f : 0x00
        );
    });

    PioneerDDJ400.initHotcueLights(null, group);
    PioneerDDJ400.initLoopLights(group);
    PioneerDDJ400.initLoopPadLights(group);
    PioneerDDJ400.initPlay(group);
    PioneerDDJ400.initCueIndicator(group);
    PioneerDDJ400.initPfl(group);
};

PioneerDDJ400.initHotcueLights = function(_value, group) {
    for (var i = 1; i <= 8; i++) {
        var light = PioneerDDJ400.lights[group].hotcuePad(i);
        PioneerDDJ400.toggleLight(light, engine.getValue(group, 'hotcue_' + i + '_enabled'));
    }
};

PioneerDDJ400.initLoopPadLights = function(group) {
    PioneerDDJ400.beatLoopPadLoopLengths.forEach(function(length, index) {
        var light = PioneerDDJ400.lights[group].beatLoopPad(index + 1);
        PioneerDDJ400.toggleLight(light, engine.getValue(group, 'beatloop_' + length + '_enabled'));
    });
};


PioneerDDJ400.initLoopLights = function(group) {
    var control = 'loop_enabled';
    var loopEnabled = engine.getValue(group, control);
    PioneerDDJ400.onLoopEnabled(loopEnabled, group, control);
};

PioneerDDJ400.initPlay = function(group) {
    var control = "play";
    var isPlaying = engine.getValue(group, control);
    PioneerDDJ400.onPlay(isPlaying, group, control);
};

PioneerDDJ400.initCueIndicator = function(group) {
    var control = "cue_indicator";
    var active = engine.getValue(group, control);
    PioneerDDJ400.onCueIndicator(active, group, control);
};

PioneerDDJ400.initPfl = function(group) {
    var control = 'pfl';
    var active = engine.getValue(group, control);
    var light = PioneerDDJ400.lights[group].pfl;
    PioneerDDJ400.toggleLight(light, active);
};

//
// Load selected track
//

PioneerDDJ400.loadSelectedTrack = function(_channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group];
    if (value) {
        engine.setValue(deck, 'LoadSelectedTrack', value);
    }
};

//
// Channel level lights
//

PioneerDDJ400.vuMeterUpdate = function(value, group) {
    var newVal = value * 150;

    switch (group) {
    case "[Channel1]":
        midi.sendShortMsg(0xB0, 0x02, newVal);
        break;

    case "[Channel2]":
        midi.sendShortMsg(0xB1, 0x02, newVal);
        break;
    }
};

//
// Trim
//

PioneerDDJ400.pregainMsb = function(_channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group];
    PioneerDDJ400.highResMSB[deck].pregain = value;
};

PioneerDDJ400.pregainLsb = function(_channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group];
    PioneerDDJ400.setParameterMsbLsb(deck, 'pregain', value);
};

//
// EQ
//

PioneerDDJ400.parameter1Msb = function(_channel, _control, value, _status, group) {
    var effect = PioneerDDJ400.groups[group];
    PioneerDDJ400.highResMSB[effect].parameter1 = value;
};

PioneerDDJ400.parameter1Lsb = function(_channel, _control, value, _status, group) {
    var effect = PioneerDDJ400.groups[group];
    PioneerDDJ400.setParameterMsbLsb(effect, 'parameter1', value);
};

PioneerDDJ400.parameter2Msb = function(_channel, _control, value, _status, group) {
    var effect = PioneerDDJ400.groups[group];
    PioneerDDJ400.highResMSB[effect].parameter2 = value;
};

PioneerDDJ400.parameter2Lsb = function(_channel, _control, value, _status, group) {
    var effect = PioneerDDJ400.groups[group];
    PioneerDDJ400.setParameterMsbLsb(effect, 'parameter2', value);
};

PioneerDDJ400.parameter3Msb = function(_channel, _control, value, _status, group) {
    var effect = PioneerDDJ400.groups[group];
    PioneerDDJ400.highResMSB[effect].parameter3 = value;
};

PioneerDDJ400.parameter3Lsb = function(_channel, _control, value, _status, group) {
    var effect = PioneerDDJ400.groups[group];
    PioneerDDJ400.setParameterMsbLsb(effect, 'parameter3', value);
};

//
// Filter
//

PioneerDDJ400.setParameterMsbLsb = function(group, parameter, lsbValue) {
    var msbValue = PioneerDDJ400.highResMSB[group][parameter];
    var combinedValue = PioneerDDJ400.combineMsbLsb(msbValue, lsbValue);
    engine.setParameter(group, parameter, script.absoluteLin(combinedValue, 0, 0.999, 0, 127));
};

//
// PFL (pre-fader listen / Headphone cueing)
//

PioneerDDJ400.pfl = function(_channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group];
    if (value) {
        engine.setValue(deck, 'pfl', !engine.getValue(deck, 'pfl'));
        PioneerDDJ400.initPfl(deck);
    }
};

//
// BPM tap
//

PioneerDDJ400.bpmTap = function(_channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group];
    if (value) {
        engine.setValue(deck, 'bpm_tap', value);
    }
};

PioneerDDJ400.volumeFaderLsb = function(_channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group];
    var msbValue = PioneerDDJ400.highResMSB[deck].volumeFader;
    var normalizedValue = PioneerDDJ400.combineMsbLsb(msbValue, value)
    engine.setParameter(deck, "volume", script.absoluteLin(normalizedValue, 0, 1, 0, 127));
};

PioneerDDJ400.volumeFaderMsb = function(_channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group];
    PioneerDDJ400.highResMSB[deck].volumeFader = value;
};

//
// Effects
//

PioneerDDJ400.toggleFxLight = function(_value, _group, _control) {
    var enabled = engine.getValue(PioneerDDJ400.focusedFxGroup(), "enabled");

    PioneerDDJ400.toggleLight(PioneerDDJ400.lights.beatFx, enabled);
    PioneerDDJ400.toggleLight(PioneerDDJ400.lights.shiftBeatFx, enabled);
};

PioneerDDJ400.focusedFxGroup = function() {
    var focusedFx = engine.getValue("[EffectRack1_EffectUnit1]", "focused_effect");
    return "[EffectRack1_EffectUnit1_Effect" + focusedFx + "]";
};

PioneerDDJ400.beatFxLevelDepthRotate = function(_channel, _control, value) {
    if (PioneerDDJ400.shiftButtonDown[0] || PioneerDDJ400.shiftButtonDown[1]) {
        engine.softTakeoverIgnoreNextValue(PioneerDDJ400.focusedFxGroup(), "meta");
        engine.setParameter("[EffectRack1_EffectUnit2]", "mix", value / 0x7F);
    } else {
        engine.softTakeoverIgnoreNextValue(PioneerDDJ400.focusedFxGroup(), "meta");
        engine.setParameter("[EffectRack1_EffectUnit1]", "mix", value / 0x7F);
    }
};

PioneerDDJ400.beatFxSelectPreviousEffect = function(_channel, _control, value) {
    engine.setValue(PioneerDDJ400.focusedFxGroup(), "prev_effect", value);
};

PioneerDDJ400.beatFxSelectNextEffect = function(_channel, _control, value) {
    engine.setValue(PioneerDDJ400.focusedFxGroup(), "next_effect", value);
};

PioneerDDJ400.beatFxLeftPressed = function(_channel, _control, value) {
    if (value === 0) { return; }

    engine.setValue("[EffectRack1_EffectUnit1]", "focused_effect", 1);
};

PioneerDDJ400.beatFxRightPressed = function(_channel, _control, value) {
    if (value === 0) { return; }

    engine.setValue("[EffectRack1_EffectUnit1]", "focused_effect", 2);
};

PioneerDDJ400.beatFxSelectPressed = function(_channel, _control, value) {
    if (value === 0) { return; }

    engine.setValue("[EffectRack1_EffectUnit1]", "focused_effect", 3);
};

PioneerDDJ400.beatFxOnOffPressed = function(_channel, _control, value) {
    if (value === 0) { return; }

    var toggleEnabled = !engine.getValue(PioneerDDJ400.focusedFxGroup(), "enabled");
    engine.setValue(PioneerDDJ400.focusedFxGroup(), "enabled", toggleEnabled);
};

PioneerDDJ400.beatFxOnOffShiftPressed = function(_channel, _control, value) {
    if (value === 0) { return; }

    engine.setParameter("[EffectRack1_EffectUnit1]", "mix", 0);
    engine.softTakeoverIgnoreNextValue("[EffectRack1_EffectUnit1]", "mix");

    for (var i = 1; i <= 3; i++) {
        engine.setValue("[EffectRack1_EffectUnit1_Effect" + i + "]", "enabled", 0);
    }
    PioneerDDJ400.toggleLight(PioneerDDJ400.lights.beatFx, false);
    PioneerDDJ400.toggleLight(PioneerDDJ400.lights.shiftBeatFx, false);
};

PioneerDDJ400.beatFxChannel = function(_channel, control, value, _status, group) {
    if (value === 0x00) { return; }

    var enableChannel1 = control === 0x10 ? 1 : 0,
        enableChannel2 = control === 0x11 ? 1 : 0,
        enableMaster = control === 0x14 ? 1 : 0;

    engine.setValue(group, "group_[Channel1]_enable", enableChannel1);
    engine.setValue(group, "group_[Channel2]_enable", enableChannel2);
    engine.setValue(group, "group_[Master]_enable", enableMaster);
};

//
// Play/Pause button
//

PioneerDDJ400.playPressed = function(_channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group];
    if (value) {
        engine.setValue(deck, 'play', !(engine.getValue(deck, 'play')))
    }
};

PioneerDDJ400.reverseRoll = function(_channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group];
    engine.setValue(deck, 'reverseroll', value)
};

//
// Cue button
//

PioneerDDJ400.cuePressed = function(_channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group];
    if (value) {
        engine.setValue(deck, 'cue_default', value)
    };
};

PioneerDDJ400.startPlay = function(_channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group];
    if (value) {
        engine.setValue(deck, 'start_play', value)
    };
}

//
// Loop IN/OUT
//

PioneerDDJ400.loopIn = function(_channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group];
    engine.setValue(deck, 'loop_in', value);
};

PioneerDDJ400.loopOut = function(_channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group];
    engine.setValue(deck, 'loop_out', value);
};

//
// Reloop
//

PioneerDDJ400.reloopToggle = function(_channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group];
    if (value) {
        engine.setValue(deck, 'reloop_toggle', value);
    };
}

PioneerDDJ400.reloopAndstop = function(_channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group];
    if (value) {
        engine.setValue(deck, 'reloop_andstop', value);
    };
};

//
// Loop IN/OUT ADJUST
//

PioneerDDJ400.toggleLoopAdjustIn = function(_channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group];
    var index = PioneerDDJ400.channelIndex(deck);

    if (value === 0 || engine.getValue(deck, "loop_enabled" === 0)) {
        return;
    }
    PioneerDDJ400.loopAdjustIn[index] = !PioneerDDJ400.loopAdjustIn[index];
    PioneerDDJ400.loopAdjustOut[index] = false;
};

PioneerDDJ400.toggleLoopAdjustOut = function(_channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group];
    var index = PioneerDDJ400.channelIndex(deck);

    if (value === 0 || engine.getValue(group, "loop_enabled" === 0)) {
        return;
    }
    PioneerDDJ400.loopAdjustOut[index] = !PioneerDDJ400.loopAdjustOut[index];
    PioneerDDJ400.loopAdjustIn[index] = false;
};

// Two signals are sent here so that the light stays lit/unlit in its shift state too
PioneerDDJ400.setReloopLight = function(status, value) {
    midi.sendShortMsg(status, 0x4D, value);
    midi.sendShortMsg(status, 0x50, value);
};


PioneerDDJ400.setLoopButtonLights = function(status, value) {
    [0x10, 0x11, 0x4E, 0x4C].forEach(function(control) {
        midi.sendShortMsg(status, control, value);
    });
};

PioneerDDJ400.startLoopLightsBlink = function(channel, control, status, group) {
    var deck = PioneerDDJ400.groups[group];
    var index = PioneerDDJ400.channelIndex(deck);
    var blink = 0x7F;

    PioneerDDJ400.stopLoopLightsBlink(deck, control, status);

    PioneerDDJ400.timers[deck][control] = engine.beginTimer(500, function() {
        blink = 0x7F - blink;

        // When adjusting the loop out position, turn the loop in light off
        if (PioneerDDJ400.loopAdjustOut[index]) {
            midi.sendShortMsg(status, 0x10, 0x00);
            midi.sendShortMsg(status, 0x4C, 0x00);
        } else {
            midi.sendShortMsg(status, 0x10, blink);
            midi.sendShortMsg(status, 0x4C, blink);
        }

        // When adjusting the loop in position, turn the loop out light off
        if (PioneerDDJ400.loopAdjustIn[index]) {
            midi.sendShortMsg(status, 0x11, 0x00);
            midi.sendShortMsg(status, 0x4E, 0x00);
        } else {
            midi.sendShortMsg(status, 0x11, blink);
            midi.sendShortMsg(status, 0x4E, blink);
        }
    });

};

PioneerDDJ400.stopLoopLightsBlink = function(group, control, status) {
    PioneerDDJ400.timers[group] = PioneerDDJ400.timers[group] || {};

    if (PioneerDDJ400.timers[group][control] !== undefined) {
        engine.stopTimer(PioneerDDJ400.timers[group][control]);
    }
    PioneerDDJ400.timers[group][control] = undefined;
    PioneerDDJ400.setLoopButtonLights(status, 0x7F);
};

PioneerDDJ400.loopToggle = function(value, group, control) {
    var status = group === "[Channel1]" ? 0x90 : 0x91,
        channel = group === "[Channel1]" ? 0 : 1;

    PioneerDDJ400.setReloopLight(status, value ? 0x7F : 0x00);

    if (value) {
        PioneerDDJ400.startLoopLightsBlink(channel, control, status, group);
    } else {
        PioneerDDJ400.stopLoopLightsBlink(group, control, status);
        PioneerDDJ400.loopAdjustIn[channel] = false;
        PioneerDDJ400.loopAdjustOut[channel] = false;
    }
};

//
// CUE/LOOP CALL
//

PioneerDDJ400.cueLoopCallLeft = function(_channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group]
    if (value) {
        engine.setValue(deck, "loop_scale", 0.5);
    }
};

PioneerDDJ400.cueLoopCallRight = function(_channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group]
    if (value) {
        engine.setValue(deck, "loop_scale", 2.0);
    }
};

//
// BEAT SYNC
//
// Note that the controller sends different signals for a short press and a long
// press of the same button.
//

PioneerDDJ400.syncPressed = function(_channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group]
    if (engine.getValue(deck, "sync_enabled") && value > 0) {
        engine.setValue(deck, "sync_enabled", 0);
    } else {
        engine.setValue(deck, "beatsync", value);
    }
};

PioneerDDJ400.syncLongPressed = function(_channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group]
    if (value) {
        engine.setValue(deck, "sync_enabled", 1);
    }
};

PioneerDDJ400.cycleTempoRange = function(_channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group]
    if (value === 0) return; // ignore release

    var currRange = engine.getValue(deck, "rateRange");
    var idx = 0;

    for (var i = 0; i < this.tempoRanges.length; i++) {
        if (currRange === this.tempoRanges[i]) {
            idx = (i + 1) % this.tempoRanges.length;
            break;
        }
    }
    engine.setValue(deck, "rateRange", this.tempoRanges[idx]);
};

//
// Jog wheels
//

PioneerDDJ400.jogTurn = function(channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group]
    var deckNum = parseInt(script.channelRegEx.exec(deck)[1])
    // wheel center at 64; <64 rew >64 fwd
    var newVal = value - 64;

    // loop_in / out adjust
    var loopEnabled = engine.getValue(deck, "loop_enabled");
    if (loopEnabled > 0) {
        var index = deckNum - 1
        if (PioneerDDJ400.loopAdjustIn[index]) {
            newVal = newVal * PioneerDDJ400.loopAdjustMultiply + engine.getValue(deck, "loop_start_position");
            engine.setValue(deck, "loop_start_position", newVal);
            return;
        }
        if (PioneerDDJ400.loopAdjustOut[index]) {
            newVal = newVal * PioneerDDJ400.loopAdjustMultiply + engine.getValue(deck, "loop_end_position");
            engine.setValue(deck, "loop_end_position", newVal);
            return;
        }
    }

    if (engine.isScratching(deckNum)) {
        engine.scratchTick(deckNum, newVal);
    } else { // fallback
        engine.setValue(deck, "jog", newVal * this.bendScale);
    }
};


PioneerDDJ400.jogSearch = function(_channel, _control, value, _status, group) {
    group = PioneerDDJ400.groups[group]
    var newVal = (value - 64) * PioneerDDJ400.fastSeekScale;
    engine.setValue(group, "jog", newVal);
};

PioneerDDJ400.jogTouch = function(channel, _control, value, _status, group) {
    var deckNum = PioneerDDJ400.deckNumberFromGroup(group);

    // skip while adjusting the loop points
    if (PioneerDDJ400.loopAdjustIn[channel] || PioneerDDJ400.loopAdjustOut[channel]) {
        return;
    }

    if (value !== 0 && this.vinylMode) {
        engine.scratchEnable(deckNum, 720, 33+1/3, this.alpha, this.beta);
    } else {
        engine.scratchDisable(deckNum);
    }
};

//
// Shift button
//

PioneerDDJ400.shiftPressed = function(channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group];
    PioneerDDJ400.shiftButtonDown[channel] = value === 0x7F;

    // Make sure these lights remain lit when shift is pressed
    PioneerDDJ400.initHotcueLights(null, deck);
    PioneerDDJ400.initPfl(deck);
};

//
// Tempo sliders
//
// The tempo option in Mixxx's deck preferences determine whether down/up
// increases/decreases the rate. Therefore it must be inverted here so that the
// UI and the control sliders always move in the same direction.
//

PioneerDDJ400.tempoSliderMSB = function(channel, control, value, status, group) {
    var deck = PioneerDDJ400.groups[group]
    PioneerDDJ400.highResMSB[deck].tempoSlider = value;
};

PioneerDDJ400.tempoSliderLSB = function(channel, control, value, status, group) {
    var deck = PioneerDDJ400.groups[group]
    var fullValue = (PioneerDDJ400.highResMSB[deck].tempoSlider << 7) + value;

    engine.setValue(
        deck,
        "rate",
        1 - (fullValue / 0x2000)
    );
};

//
// Hot cue pads
//

PioneerDDJ400.hotcuePadFunction = function(property, padNum) {
    return function(_channel, _control, value, _status, group) {
        var deck = PioneerDDJ400.groups[group];
        var light = PioneerDDJ400.lights[group].hotcuePad(padNum);
        engine.setValue(deck, property, value);
        PioneerDDJ400.toggleLight(light, engine.getValue(deck, 'hotcue_' + padNum + '_enabled'));
    };
};

//
// Beat loop pads
//

PioneerDDJ400.beatLoopPadLoopLengths = [
    '0.25', '0.5', '1', '2', '4', '8', '16', '32'
];

PioneerDDJ400.beatLoopPadFunction = function(property) {
    return function(_channel, _control, value, _status, group) {
        var deck = PioneerDDJ400.groups[group];
        engine.setValue(deck, property, value);
        PioneerDDJ400.initLoopPadLights(deck);
    };
};

//
// Beat Jump mode
//
// Note that when we increase/decrease the sizes on the pad buttons, we use the
// value of the first pad (0x21) as an upper/lower limit beyond which we don't
// allow further increasing/decreasing of all the values.
//

PioneerDDJ400.beatjumpPadPressed = function(_channel, control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group]
    if (value === 0) {
        return;
    }
    engine.setValue(deck, "beatjump_size", Math.abs(PioneerDDJ400.beatjumpSizeForPad[control]));
    engine.setValue(deck, "beatjump", PioneerDDJ400.beatjumpSizeForPad[control]);
};

PioneerDDJ400.increaseBeatjumpSizes = function(_channel, control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group]

    if (value === 0 || PioneerDDJ400.beatjumpSizeForPad[0x21] * 16 > 16) {
        return;
    }
    Object.keys(PioneerDDJ400.beatjumpSizeForPad).forEach(function(pad) {
        PioneerDDJ400.beatjumpSizeForPad[pad] = PioneerDDJ400.beatjumpSizeForPad[pad] * 16;
    });
    engine.setValue(deck, "beatjump_size", PioneerDDJ400.beatjumpSizeForPad[0x21]);
};

PioneerDDJ400.decreaseBeatjumpSizes = function(_channel, control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group]

    if (value === 0 || PioneerDDJ400.beatjumpSizeForPad[0x21] / 16 < 1/16) {
        return;
    }
    Object.keys(PioneerDDJ400.beatjumpSizeForPad).forEach(function(pad) {
        PioneerDDJ400.beatjumpSizeForPad[pad] = PioneerDDJ400.beatjumpSizeForPad[pad] / 16;
    });
    engine.setValue(deck, "beatjump_size", PioneerDDJ400.beatjumpSizeForPad[0x21]);
};

//
// Sampler mode
//

PioneerDDJ400.samplerPlayOutputCallbackFunction = function(value, group, _control) {
    if (value === 1) {
        var curPad = group.match(script.samplerRegEx)[1];
        PioneerDDJ400.startSamplerBlink(
            0x97 + (curPad > 8 ? 2 : 0),
            0x30 + ((curPad > 8 ? curPad - 8 : curPad) - 1),
            group);
    }
};

PioneerDDJ400.samplerPadPressed = function(_channel, _control, value, _status, group) {
    if (engine.getValue(group, "track_loaded")) {
        engine.setValue(group, "cue_gotoandplay", value);
    } else {
        engine.setValue(group, "LoadSelectedTrack", value);
    }
};

PioneerDDJ400.samplerPadShiftPressed = function(_channel, _control, value, _status, group) {
    if (engine.getValue(group, "play")) {
        engine.setValue(group, "cue_gotoandstop", value);
    } else if (engine.getValue(group, "track_loaded")) {
        engine.setValue(group, "eject", value);
    }
};

PioneerDDJ400.startSamplerBlink = function(channel, control, group) {
    var val = 0x7f;

    PioneerDDJ400.stopSamplerBlink(channel, control);
    PioneerDDJ400.timers[channel][control] = engine.beginTimer(250, function() {
        val = 0x7f - val;

        // blink the appropriate pad
        midi.sendShortMsg(channel, control, val);
        // also blink the pad while SHIFT is pressed
        midi.sendShortMsg((channel+1), control, val);

        var isPlaying = engine.getValue(group, "play") === 1;

        if (!isPlaying) {
            // kill timer
            PioneerDDJ400.stopSamplerBlink(channel, control);
            // set the pad LED to ON
            midi.sendShortMsg(channel, control, 0x7f);
            // set the pad LED to ON while SHIFT is pressed
            midi.sendShortMsg((channel+1), control, 0x7f);
        }
    });
};

PioneerDDJ400.stopSamplerBlink = function(channel, control) {
    PioneerDDJ400.timers[channel] = PioneerDDJ400.timers[channel] || {};

    if (PioneerDDJ400.timers[channel][control] !== undefined) {
        engine.stopTimer(PioneerDDJ400.timers[channel][control]);
        PioneerDDJ400.timers[channel][control] = undefined;
    }
};

//
// Additional features
//

PioneerDDJ400.toggleQuantize = function(_channel, _control, value, _status, group) {
    if (value) {
        script.toggleControl(group, "quantize");
    }
};

PioneerDDJ400.quickJumpForward = function(_channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group]
    if (value) {
        engine.setValue(deck, "beatjump", PioneerDDJ400.quickJumpSize);
    }
};

PioneerDDJ400.quickJumpBack = function(_channel, _control, value, _status, group) {
    var deck = PioneerDDJ400.groups[group]
    if (value) {
        engine.setValue(deck, "beatjump", -PioneerDDJ400.quickJumpSize);
    }
};

//
// Shutdown
//

PioneerDDJ400.shutdown = function() {
    // reset vumeter
    PioneerDDJ400.toggleLight(PioneerDDJ400.lights['[Channel1]'].vuMeter, false);
    PioneerDDJ400.toggleLight(PioneerDDJ400.lights['[Channel2]'].vuMeter, false);

    // housekeeping
    // turn off all Sampler LEDs
    for (var i = 0; i <= 7; ++i) {
        midi.sendShortMsg(0x97, 0x30 + i, 0x00);    // Deck 1 pads
        midi.sendShortMsg(0x98, 0x30 + i, 0x00);    // Deck 1 pads with SHIFT
        midi.sendShortMsg(0x99, 0x30 + i, 0x00);    // Deck 2 pads
        midi.sendShortMsg(0x9A, 0x30 + i, 0x00);    // Deck 2 pads with SHIFT
    }
    // turn off all Hotcue LEDs
    for (i = 0; i <= 7; ++i) {
        midi.sendShortMsg(0x97, 0x00 + i, 0x00);    // Deck 1 pads
        midi.sendShortMsg(0x98, 0x00 + i, 0x00);    // Deck 1 pads with SHIFT
        midi.sendShortMsg(0x99, 0x00 + i, 0x00);    // Deck 2 pads
        midi.sendShortMsg(0x9A, 0x00 + i, 0x00);    // Deck 2 pads with SHIFT
    }

    // turn off loop in and out lights
    PioneerDDJ400.setLoopButtonLights(0x90, 0x00);
    PioneerDDJ400.setLoopButtonLights(0x91, 0x00);

    // turn off reloop lights
    PioneerDDJ400.setReloopLight(0x90, 0x00);
    PioneerDDJ400.setReloopLight(0x91, 0x00);

    // stop any flashing lights
    PioneerDDJ400.toggleLight(PioneerDDJ400.lights.beatFx, false);
    PioneerDDJ400.toggleLight(PioneerDDJ400.lights.shiftBeatFx, false);
};
