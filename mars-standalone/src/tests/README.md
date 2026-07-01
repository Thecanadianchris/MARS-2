# MARS Test Framework

## Version

v0.12.4

## Purpose

This folder contains the MARS smoke test framework.

The smoke tests verify that core MARS software capabilities can load, execute and return expected structural outputs before a release is frozen.

## Test Framework

MARS uses Vitest for smoke testing.

This aligns the test environment with the Vite application environment and avoids changing production imports purely for test execution.

## Commands

```bash
npm run smoke