import { saveBasicInfoAction } from "@/app/actions/table4";

export async function POST(request: Request) {
  const formData = await request.formData();
  const result = await saveBasicInfoAction({}, formData);
  return Response.json(result);
}
