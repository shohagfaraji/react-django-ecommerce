#!/usr/bin/env bash
set -o errexit

pip install --upgrade pip
pip install "Django==5.1.7"
pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate