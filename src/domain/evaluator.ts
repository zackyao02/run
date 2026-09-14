import type { EvaluationRule, RuleStatus } from "@/src/domain/types";

export type LocalInputs = Record<string, string>;

function numericValue(value: string): number | undefined {
  const match = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

export function evaluateRule(rule: EvaluationRule, inputs: LocalInputs): RuleStatus {
  const value = inputs[rule.inputId] ?? "";
  const min = rule.params?.min;
  const max = rule.params?.max;

  switch (rule.operator) {
    case "required":
      return value.trim() ? "matched" : "not_matched";
    case "contains_number":
      return /\d/.test(value) ? "matched" : "not_matched";
    case "length_between": {
      const length = value.trim().length;
      if (min !== undefined && length < min) return "not_matched";
      if (max !== undefined && length > max) return "not_matched";
      return "matched";
    }
    case "value_between": {
      const number = numericValue(value);
      if (number === undefined) return "not_matched";
      if (min !== undefined && number < min) return "not_matched";
      if (max !== undefined && number > max) return "not_matched";
      return "matched";
    }
    case "manual_evidence":
      return "needs_review";
    default:
      return "needs_review";
  }
}

export function evaluateRun(
  components: Array<{ type: string; id: string; evaluation?: EvaluationRule }>,
  inputs: LocalInputs,
): Record<string, RuleStatus> {
  return Object.fromEntries(
    components
      .filter((component) => component.type === "check" && component.evaluation)
      .map((component) => [component.id, evaluateRule(component.evaluation!, inputs)]),
  );
}
