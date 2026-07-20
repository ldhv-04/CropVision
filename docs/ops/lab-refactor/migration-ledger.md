# Migration Ledger

| Phase | Start SHA | Status | Product/config source changed | Checkpoint |
|---|---|---|---|---|
| L1 fresh audit | `484c1cc6f476b970f5f047bee22482ae1063cb2b` | complete | no | `f2d57894010a815e332795c5641138e48cb6b884` |
| L2 architecture contract | `f2d57894010a815e332795c5641138e48cb6b884` | complete | test and docs only | `56af317fa141554b4be9972f315e587566c92888` |
| L3 platform/session/transport | `56af317fa141554b4be9972f315e587566c92888` | complete | neutral frontend core/platform only | `e738d1e6a96ebead6d1466f509e261daf7b16ff9` |
| L4A Station public boundary | `e738d1e6a96ebead6d1466f509e261daf7b16ff9` | implementation/tests in progress | Station public entry and missing renderer dependency | pending L4A commit |

No owner migration, route rewiring, legacy deletion, or package change has occurred yet.
L3 replaces duplicate runtime detection and the hidden transport/auth require with neutral,
tested capability and session seams. L4A adds the Station root entry without moving owner
internals; route migration remains L4B.
