import { notFound } from "next/navigation";
import { OperatorConsole } from "@/src/components/operator-console";

export default function OperatorPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <OperatorConsole />;
}
