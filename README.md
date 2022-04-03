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
- [ ] Use softTakeover for EQ, trim and volume faders
- [x] See if anything needs to be done with SAMPLER pads
- [x] Investigate pad buttons + shift mappings
- [ ] Update shutdown to flip off the beat sync light, loop pads, hot cue pads
- [ ] Remove or remap toggle quantize (it's already bound to bpm tap)
- [ ] Move LEVEL/DEPTH + SHIFT customization to a branch
- [ ] Clean up XML (delete commented out outputs)
- [ ] Clean up JS
- [ ] Update code comments as needed
- [ ] Update README with instructions
- [ ] Post in [forum](https://mixxx.discourse.group/t/pioneer-ddj-400/17476) for feedback
- [ ] Post in [Controller mappings forum](https://mixxx.discourse.group/c/controller-mappings/10) for feedback

## Notes

- Secondary pad modes (keyboard, pad FX1, pad FX2, and key shift ) are still not
  implemented with this. These would be activated by the pad mode button +SHIFT.

## Resources

- [Pioneer DDJ-400 forum](https://mixxx.discourse.group/t/pioneer-ddj-400/17476)
- [Pioneer DDJ-400 midi messages PDF](https://www.pioneerdj.com/-/media/pioneerdj/software-info/controller/ddj-400/ddj-400_midi_message_list_e1.pdf?la=en&hash=21267BEBE0C043449CBC2A039996279E3D14B8EB)
- [Mixxx's midi-scripting docs](https://github.com/mixxxdj/mixxx/wiki/Midi-Scripting)
- [Mixxx's Contribute Mappings docs](https://github.com/mixxxdj/mixxx/wiki/Contributing-Mappings)
- [Mixxx's controls docs](https://manual.mixxx.org/2.3/en/chapters/appendix/mixxx_controls.html)
- [Mixxx's troubleshooting docs](https://github.com/mixxxdj/mixxx/wiki/troubleshooting)

