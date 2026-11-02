---
title: ECricket
studio: LightFury Games
role: Principal Gameplay Engineer
engine: Unreal Engine 5 · C++20
platforms: Mobile now, PC and console on the roadmap
badge: In production
order: 1
cover: ../../assets/projects/ecricket.png
gallery: [../../assets/projects/ecricket-2.jpg, ../../assets/projects/ecricket-3.jpg]
summary: Flagship UE5 cricket title. I own the core gameplay architecture, the locomotion refactor and the server-authoritative multiplayer layer.
stack: [C++20, UE5, StateTree, Gameplay Tags, Unreal Insights, Perforce]
caseStudy: true
results:
  - { value: "120 FPS", label: "target frame lock on mobile" }
  - { value: "0", label: "per-frame heap allocations in the gameplay tick" }
  - { value: "1 TDD", label: "studio-wide C++ standard (ECRICKET-7884)" }
---

## The problem

The batsman, fielders and bowler had grown into a tangle of direct references. Animation, input, ability logic and networking all reached into each other, so any change to locomotion broke something in another discipline, and tick cost kept creeping up.

## The system

I rebuilt the character layer around **StateTree** and **Gameplay Tags**. Each locomotion and ability state is a self-contained task that declares what it needs through tags instead of calling other components directly. Animation listens for tag changes; networking replicates the tag container and a small state header rather than whole components.

- **Decoupled locomotion and interaction.** Idle, sprint, dodge and shot states are isolated StateTree tasks with explicit entry and exit conditions.
- **Tick budgeting.** Components were moved into deliberate tick groups, and anything that didn't need per-frame work moved to timers or events.
- **Studio standard.** I wrote TDD/ECRICKET-7884, which sets the modern C++ patterns, ownership rules and tick budgets the rest of the team now follows.

## Profiling

Unreal Insights sessions on low-end Android hardware drove the work. The biggest wins came from removing micro-hitches caused by allocation in the gameplay tick, and from collapsing redundant tick functions into grouped updates.

## Result

Designers and animators can add states without touching engineering code, the gameplay tick stays allocation-free, and the game holds its frame target on the device floor we ship to.
