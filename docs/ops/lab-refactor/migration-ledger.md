# Migration Ledger

| Phase | Start SHA | Status | Product/config source changed | Checkpoint |
|---|---|---|---|---|
| L1 fresh audit | `484c1cc6f476b970f5f047bee22482ae1063cb2b` | complete | no | `f2d57894010a815e332795c5641138e48cb6b884` |
| L2 architecture contract | `f2d57894010a815e332795c5641138e48cb6b884` | complete | test and docs only | `56af317fa141554b4be9972f315e587566c92888` |
| L3 platform/session/transport | `56af317fa141554b4be9972f315e587566c92888` | complete | neutral frontend core/platform only | `e738d1e6a96ebead6d1466f509e261daf7b16ff9` |
| L4A Station public boundary | `e738d1e6a96ebead6d1466f509e261daf7b16ff9` | complete | Station public entry and missing renderer dependency | `5b4b6127` |
| L4B Station route adoption | `486071fb` (post-drift re-audit `17a7486`) | complete | Station routes + web layout via public entry | `12284b7` |
| L5A Agrivision public boundary + route adoption | `f732e3c` | complete | agrivision/index.js, nine route swaps | `f732e3c` |
| L5B Agrivision/inference route extraction | `8747a10` | complete | home/diagnosis/encyclopedia/chat/settings implementations moved into modules; inference public entry | `14acdf3` |
| S2/S3 boundary hardening | `acb13d6` | complete | inference field-context prop; @core/store contained | `a704a1b` |
| S12 dead-code retirement | `648573c` | complete | AdminPanel, config/api, constants/theme, Test.txt removed | `648573c` |

No owner migration, route rewiring, legacy deletion, or package change has occurred yet.
L3 replaces duplicate runtime detection and the hidden transport/auth require with neutral,
tested capability and session seams. L4A adds the Station root entry without moving owner
internals; route migration remains L4B.
