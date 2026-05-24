# Onboarding `answer_payload` — Draft Shape

> **DRAFT / DOCS ONLY.** No SQL is applied. No frontend writes exist. The
> `/demo/client/onboarding` page collects this information into local
> component state only; nothing is saved. This document locks down the
> *shape* of the future `onboarding_items.answer_payload` so the form,
> validation, and write surface can be built consistently when real auth +
> production RLS + audit logs are in place.

This payload mirrors the six sections in `src/pages/client-onboarding.tsx`.

## 1. Restaurant Basics

| Key | Type | Notes |
| --- | --- | --- |
| `restaurant_name` | string | Required later. |
| `main_contact_name` | string | |
| `contact_email` | string | Must be valid email (later). |
| `phone_number` | string | E.164 recommended (later). |
| `address` | string | Free text in V1. |
| `website` | string | URL (later). |
| `google_business_profile_link` | string | URL (later). |

## 2. Brand & Positioning

| Key | Type |
| --- | --- |
| `cuisine_type` | string |
| `dietary_specialty_notes` | string |
| `brand_tone` | string |
| `best_selling_items` | string |
| `items_to_promote_this_month` | string |
| `items_to_avoid_promoting` | string |

## 3. Menu & Offers

| Key | Type | Notes |
| --- | --- | --- |
| `menu_link` | string | URL (later). |
| `menu_upload_asset_id` | uuid \| null | References `media_assets.id` once media uploads ship. |
| `current_specials` | string | |
| `catering_family_platters_lunch_specials` | string | |

## 4. Content Preferences

| Key | Type | Notes |
| --- | --- | --- |
| `preferred_platforms` | string[] | Enum array (later): `instagram`, `facebook`, `tiktok`, `google_business_profile`. |
| `preferred_posting_days` | string | Free text in V1; may move to string[] day enum later. |
| `preferred_posting_times` | string | Free text in V1. |
| `allow_veroxa_recommended_times` | boolean | |

## 5. Media Instructions

| Key | Type |
| --- | --- |
| `media_types_available` | string |
| `media_uploader` | string |
| `upload_frequency` | string |
| `presentation_or_filming_notes` | string |

## 6. Google Visibility

| Key | Type |
| --- | --- |
| `current_google_rating` | string |
| `review_goals` | string |
| `service_areas` | string |
| `target_keywords` | string |
| `common_customer_questions` | string |

## Example payload

```json
{
  "restaurant_basics": {
    "restaurant_name": "Maison Saffron",
    "main_contact_name": "L. Haddad",
    "contact_email": "owner@maisonsaffron.example",
    "phone_number": "+1-555-555-0100",
    "address": "12 Olive Lane, Brooklyn, NY",
    "website": "https://maisonsaffron.example",
    "google_business_profile_link": "https://g.page/maison-saffron"
  },
  "brand_and_positioning": {
    "cuisine_type": "Modern Levantine",
    "dietary_specialty_notes": "Halal kitchen; clear veg/vegan markers",
    "brand_tone": "warm, premium, family-led",
    "best_selling_items": "Lamb shawarma plate, saffron rice, baklava",
    "items_to_promote_this_month": "Weekend mezze tasting",
    "items_to_avoid_promoting": "Seasonal kibbeh (out of stock)"
  },
  "menu_and_offers": {
    "menu_link": "https://maisonsaffron.example/menu",
    "menu_upload_asset_id": null,
    "current_specials": "Tuesday family platter — 4 mains for $48",
    "catering_family_platters_lunch_specials": "Catering trays from 8 ppl"
  },
  "content_preferences": {
    "preferred_platforms": ["instagram", "google_business_profile"],
    "preferred_posting_days": "Tue, Thu, Sat",
    "preferred_posting_times": "11:30 and 18:00",
    "allow_veroxa_recommended_times": true
  },
  "media_instructions": {
    "media_types_available": "Phone photos weekly; pro shoot monthly",
    "media_uploader": "Owner + kitchen lead",
    "upload_frequency": "Weekly",
    "presentation_or_filming_notes": "Overhead plating; keep brand placemat visible"
  },
  "google_visibility": {
    "current_google_rating": "4.3",
    "review_goals": "4.6+ within 90 days",
    "service_areas": "Park Slope, Gowanus, Carroll Gardens",
    "target_keywords": "best halal brunch brooklyn, levantine catering nyc",
    "common_customer_questions": "Parking? Reservations? Vegan options?"
  }
}
```

## Validation notes (future, not implemented today)

- `contact_email` must be a valid email.
- `website` and `google_business_profile_link` must be URLs.
- `preferred_platforms` must be an enum array.
- `allow_veroxa_recommended_times` must be a boolean.
- `menu_upload_asset_id` must reference `media_assets.id` (once that write
  surface exists).
- **No validation is currently implemented in the demo UI.** All inputs are
  free-text strings in local component state and are discarded on refresh.
