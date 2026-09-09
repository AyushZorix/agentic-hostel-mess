#!/usr/bin/env python3
"""
List available models from OpenRouter or Hugging Face using locally-set environment variables.

Usage:
  export OPENROUTER_API_KEY=...   # or HF_API_TOKEN=...
  python3 scripts/list_models.py

This script does not accept tokens via stdin or arguments — set them locally.
"""
import os
import json
import urllib.request
import urllib.error


def fetch_openrouter_models(key: str):
    url = "https://api.openrouter.ai/v1/models"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.load(resp)


def fetch_hf_models(key: str):
    url = "https://api-inference.huggingface.co/models"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.load(resp)


def main():
    or_key = os.environ.get("OPENROUTER_API_KEY")
    hf_key = os.environ.get("HF_API_TOKEN") or os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_API_TOKEN")

    if or_key:
        print("Using OpenRouter key from OPENROUTER_API_KEY — fetching models...")
        try:
            data = fetch_openrouter_models(or_key)
            print(json.dumps(data, indent=2)[:4000])
            return
        except urllib.error.HTTPError as e:
            print("OpenRouter HTTP error:", e.read().decode(errors='ignore'))
        except Exception as e:
            print("OpenRouter error:", e)

    if hf_key:
        print("Using Hugging Face token from HF_API_TOKEN — fetching models...")
        try:
            data = fetch_hf_models(hf_key)
            # HF returns a list of models; show first 50
            print(json.dumps(data[:50], indent=2))
            return
        except urllib.error.HTTPError as e:
            print("Hugging Face HTTP error:", e.read().decode(errors='ignore'))
        except Exception as e:
            print("Hugging Face error:", e)

    print("No API key found. Set OPENROUTER_API_KEY or HF_API_TOKEN in your environment and re-run this script.")


if __name__ == "__main__":
    main()
