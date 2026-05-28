from fastapi import APIRouter

from app.api.v1.endpoints import auth, pets, nutrition, analytics, supply_chain, subscriptions

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(pets.router, prefix="/pets", tags=["Pets"])
api_router.include_router(nutrition.router, prefix="/nutrition", tags=["Nutrition"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(supply_chain.router, prefix="/supply-chain", tags=["Supply Chain"])
api_router.include_router(subscriptions.router, prefix="/subscriptions", tags=["Subscriptions"])
