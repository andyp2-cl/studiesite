import { BASE } from "@/app/mockup/_mock";
import { TaskDemo } from "./task-demo";

export default function MockTask() {
  return <TaskDemo closeHref={`${BASE}/moment`} />;
}
