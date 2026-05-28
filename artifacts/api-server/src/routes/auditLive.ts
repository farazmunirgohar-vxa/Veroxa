import { Router, type IRouter } from "express";
import {
  getRealRestaurantDetails,
  searchRealRestaurants,
} from "../lib/googlePlaces";
import { scanRestaurantWebPresence } from "../lib/webPresenceScanner";

const router: IRouter = Router();

interface SearchBody {
  restaurantName?: string;
  city?: string;
  state?: string;
}

router.post("/audit/search-restaurants", async (req, res) => {
  const body = (req.body ?? {}) as SearchBody;
  const restaurantName = (body.restaurantName ?? "").toString().trim();
  if (restaurantName.length === 0 || restaurantName.length > 200) {
    res.status(400).json({
      mode: "error",
      candidates: [],
      message: "Restaurant name is required.",
    });
    return;
  }
  const city = (body.city ?? "").toString().trim().slice(0, 100);
  const state = (body.state ?? "").toString().trim().slice(0, 100);

  const result = await searchRealRestaurants({ restaurantName, city, state });
  res.json(result);
});

interface DetailsBody {
  placeId?: string;
}

router.post("/audit/restaurant-details", async (req, res) => {
  const body = (req.body ?? {}) as DetailsBody;
  const placeId = (body.placeId ?? "").toString().trim();
  if (!placeId || placeId.length > 200) {
    res.status(400).json({
      mode: "error",
      profile: null,
      webPresence: null,
      message: "Place id is required.",
    });
    return;
  }

  const details = await getRealRestaurantDetails(placeId);
  const profile = details.profile;
  const webPresence = profile?.websiteUrl
    ? await scanRestaurantWebPresence({
        websiteUrl: profile.websiteUrl,
        restaurantName: profile.name,
      })
    : null;

  res.json({
    mode: details.mode,
    profile,
    webPresence,
    message: details.message,
  });
});

export default router;
