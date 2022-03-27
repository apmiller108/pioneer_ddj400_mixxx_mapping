#!/usr/bin/env bash

# Copies the mapping files to Mixxx's user controller directory and starts Mixxx
# with controller debugging.
cp Pioneer-DDJ-400* ~/.mixxx/controllers && pasuspender -- mixxx --controllerDebug
