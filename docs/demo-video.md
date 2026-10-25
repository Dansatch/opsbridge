# OpsBridge demo video plan

Target length: **75 seconds**. Record at 1440p or 1080p with the browser chrome
visible briefly at the start so the public URL is credible.

| Time   | Action                                                               | Voiceover                                                                                                      |
| ------ | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 0–7s   | Open the live URL; let parcels move.                                 | “OpsBridge is a live warehouse and device operations simulator.”                                               |
| 7–17s  | Select a moving parcel.                                              | “Orders move through receiving, picking, packing and dispatch without any setup.”                              |
| 17–27s | Select the packing printer.                                          | “The same event model drives the equipment health, activity feed and operational summary.”                     |
| 27–38s | Open **Cause some trouble** and choose **Jam packing printer**.      | “I can inject a realistic fault. The printer stops, work waits and OpsBridge opens an incident automatically.” |
| 38–49s | Point out the affected station, incident priority and device status. | “The control room keeps the technical detail clear without burying the operator in panels.”                    |
| 49–59s | Acknowledge the incident.                                            | “Acknowledgement reveals a fault-specific recovery action.”                                                    |
| 59–68s | Apply **Clear printer jam**; let the parcel move again.              | “Recovery restores the device, resolves the incident and gets the floor moving again.”                         |
| 68–75s | Switch to night shift and finish on the full floor.                  | “It is a full-stack TypeScript project with WebSockets, SQLite, automated tests and CI.”                       |

## Recording notes

- Start from a fresh deploy with no active incident.
- Keep the pointer moving deliberately and pause after each state change.
- Avoid scrolling; the complete story should remain on one control-room screen.
- Use the printer jam because its blocked parcel and recovery are immediately clear.
- Record the voiceover separately if live narration makes the interaction rushed.
- End on the repository URL or add it as a simple final title card.
