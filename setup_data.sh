#!/bin/bash
set -e

# Needs pandas, so use backend venv
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install pandas
cd ..
python generate_samples.py
