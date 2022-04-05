# pioneer_ddj400_mixxx_mapping
4 deck script mapping for the Pioneer DDJ 400 controller for Mixxx

## TODOs

- [x] Use BEAT SYNC + Shift to toggle decks
- [x] Revent to original RELOOP/EXIT + Shift in XML
- [x] Init Cue lights when toggling decks
- [x] Init Play lights when toggling decks
- [x] Update track loading control for decks 3 and 4
- [x] Implement CUE/LOOP CALL
- [x] Configure BEAT LOOP pads
- [x] Configure BEAT JUMP pads (see also Beatjump output for pads 7&8)
- [x] Update headphone cue controls to operate on decks 3 and 4
- [x] Fix init play button light
- [x] Update fader controls to operate on decks 3 and 4
- [x] Consider how to set faders 3 and 4 on init
- [x] Update the EQ controls to operate on decks 3 and 4
- [x] Update trim controls to operate on decks 3 and 4
- [x] Update filter controls to operate on decks 3 and 4
- [x] Use softTakeover for EQ, trim, filter and volume faders
- [x] See if anything needs to be done with SAMPLER pads
- [x] Investigate pad buttons + shift mappings
- [x] Update shutdown to flip off the beat sync light, loop pads, hot cue pads
- [x] Clean up XML (delete commented out outputs)
- [ ] Clean up JS
- [ ] Update code comments as needed
- [ ] Update README with instructions
- [ ] Move LEVEL/DEPTH + SHIFT customization to a branch (beatFxLevelDepthRotate)
- [ ] Post in [forum](https://mixxx.discourse.group/t/pioneer-ddj-400/17476) for feedback
- [ ] Post in [Controller mappings forum](https://mixxx.discourse.group/c/controller-mappings/10) for feedback
- [ ] Update `forums` XML node with link
- [ ] Figure out something to do with BEAT FX for channels 3 and 4

[DDJ400 manual for 2 deck controller](https://manual.mixxx.org/2.3/en/hardware/controllers/pioneer_ddj_400.html)

Pressing `BEATSYNC +SHIFT` will toggle desks. `cycleTempoRange` is no longer mapped.
## Notes

- Long pressing of `BEATSYNC` will still enable `sync` for the active deck; however,
  it will not turn on the `BEATSYNC` light. When the `BEATSYNC` light is on, that
  indicates the alternate deck is being controlled (ie, decks 3 and 4).
- Secondary pad modes (keyboard, pad FX1, pad FX2, and key shift ) are still not
  implemented with this. These would normally be activated by the pad mode
  button +SHIFT. Doing so will make the button begin flashing, but will not do
  anything.
- `pfl +SHIFT` (channel cue +SHIFT) is mapped to two things: 1) toggle
  `quantize` and 2) `bpm_tap`. This was part of the existing mapping and seems
  fine. `bpm_tap` appears to take at least 3 taps over a short time in order to
  take affect so it's unlikely to be activated when just toggleing the `quantize`.
- MSB/LSB based on: https://github.com/mixxxdj/mixxx/blob/main/src/controllers/midi/midicontroller.cpp#L316-L336

## Resources

- [Pioneer DDJ-400 forum](https://mixxx.discourse.group/t/pioneer-ddj-400/17476)
- [Pioneer DDJ-400 midi messages PDF](https://www.pioneerdj.com/-/media/pioneerdj/software-info/controller/ddj-400/ddj-400_midi_message_list_e1.pdf?la=en&hash=21267BEBE0C043449CBC2A039996279E3D14B8EB)
- [Mixxx's midi-scripting docs](https://github.com/mixxxdj/mixxx/wiki/Midi-Scripting)
- [Mixxx's Contribute Mappings docs](https://github.com/mixxxdj/mixxx/wiki/Contributing-Mappings)
- [Mixxx's controls docs](https://manual.mixxx.org/2.3/en/chapters/appendix/mixxx_controls.html)
- [Mixxx's troubleshooting docs](https://github.com/mixxxdj/mixxx/wiki/troubleshooting)

