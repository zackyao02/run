#!/usr/bin/env python3
from pathlib import Path
import json, sys
import jsonschema
import yaml

ROOT = Path(__file__).resolve().parents[1]
ALLOWED_OPERATORS = {"required", "contains_number", "length_between", "value_between", "manual_evidence"}

def main():
    failures = []

    # JSON parse
    for p in ROOT.rglob("*.json"):
        try:
            json.loads(p.read_text(encoding="utf-8"))
        except Exception as e:
            failures.append(f"JSON parse failed: {p.relative_to(ROOT)}: {e}")

    # OpenAPI YAML parse
    try:
        data = yaml.safe_load((ROOT/"spec"/"openapi.yaml").read_text(encoding="utf-8"))
        assert data.get("openapi") == "3.1.0"
    except Exception as e:
        failures.append(f"OpenAPI parse failed: {e}")

    # Executable schema fixtures
    try:
        schema = json.loads((ROOT/"spec"/"executable-run.schema.json").read_text(encoding="utf-8"))
        for p in sorted((ROOT/"fixtures").glob("*expected-schema.json")):
            inst = json.loads(p.read_text(encoding="utf-8"))
            try:
                jsonschema.validate(inst, schema)
                print(f"PASS schema: {p.name}")
            except Exception as e:
                failures.append(f"Schema validation failed: {p.name}: {e}")

            component_ids = {c.get("id") for c in inst.get("components", [])}
            input_ids = {item.get("id") for item in inst.get("inputs", [])}
            check_count = 0
            deterministic_count = 0
            for component in inst.get("components", []):
                if component.get("type") == "check":
                    check_count += 1
                    evaluation = component.get("evaluation")
                    if inst.get("capability") == "inspect" and not evaluation:
                        failures.append(f"Missing evaluation in {p.name}: {component.get('id')}")
                    if evaluation:
                        operator = evaluation.get("operator")
                        if operator not in ALLOWED_OPERATORS:
                            failures.append(f"Invalid operator in {p.name}: {operator}")
                        if input_ids and evaluation.get("inputId") not in input_ids:
                            failures.append(f"Unknown inputId in {p.name}: {evaluation.get('inputId')}")
                        if operator in {"required", "contains_number", "length_between", "value_between"}:
                            deterministic_count += 1
                if component.get("type") != "choice":
                    continue
                for option in component.get("options", []):
                    if option.get("nextId") not in component_ids:
                        failures.append(
                            f"Invalid choice nextId in {p.name}: "
                            f"{component.get('id')} -> {option.get('nextId')}"
                        )
    except Exception as e:
        failures.append(f"Could not load executable schema: {e}")

    # Judge schema itself parse
    try:
        json.loads((ROOT/"spec"/"judge-result.schema.json").read_text(encoding="utf-8"))
    except Exception as e:
        failures.append(f"Judge schema parse failed: {e}")

    try:
        programability = json.loads((ROOT/"spec"/"programability-result.schema.json").read_text(encoding="utf-8"))
        jsonschema.Draft202012Validator.check_schema(programability)
        cases = json.loads((ROOT/"tests"/"compiler-cases.json").read_text(encoding="utf-8"))
        for case in cases:
            fixture = ROOT / "fixtures" / case["fixture"]
            if not fixture.exists():
                failures.append(f"Compiler case fixture missing: {case['fixture']}")
        print(f"PASS compiler cases: {len(cases)} fixtures discovered")
    except Exception as e:
        failures.append(f"Programability/compiler contract failed: {e}")

    if failures:
        print("\nFAILURES:")
        for f in failures:
            print("-", f)
        sys.exit(1)

    print("\nALL LOCAL CONTRACT CHECKS PASSED")

if __name__ == "__main__":
    main()
