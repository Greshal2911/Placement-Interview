import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getAnalyticsForUserParam } from "@/lib/analytics";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const analytics = await getAnalyticsForUserParam(userId);

    if (!analytics) {
      return errorResponse("User not found", undefined, 404);
    }

    return successResponse(
      analytics,
      "Analytics fetched successfully",
      200,
    );
  } catch (error) {
    console.error("Get analytics error:", error);
    return errorResponse("Failed to fetch analytics", String(error), 500);
  }
}
