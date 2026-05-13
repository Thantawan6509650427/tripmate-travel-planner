import type { Request, Response } from "express";
import { getTripRecommendations } from "../services/recommendationService.js";

export const getTripRecommendationsController = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        code: "AUTH_UNAUTHORIZED",
        message: "Unauthorized",
      });
    }

    if (!tripId) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELD",
        message: "tripId is required",
        error: { field: "tripId" },
      });
    }

    const data = await getTripRecommendations(tripId, userId);

    return res.status(200).json({
      success: true,
      code: "RECOMMENDATIONS_FETCHED",
      message: "Trip recommendations generated successfully",
      data,
    });
  } catch (error: any) {
    if (error.message === "Trip not found") {
      return res.status(404).json({
        success: false,
        code: "TRIP_NOT_FOUND",
        message: "Trip not found",
      });
    }

    if (error.message === "FORBIDDEN") {
      return res.status(403).json({
        success: false,
        code: "AUTH_FORBIDDEN",
        message: "You are not allowed to view recommendations for this trip",
      });
    }

    console.error("getTripRecommendationsController error:", error);

    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Failed to generate recommendations",
    });
  }
};
