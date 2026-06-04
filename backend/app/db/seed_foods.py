"""
Seed script — populates food_products table with real Turkish/global pet food data.
Run once on startup if table is empty.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from app.models.food_product import FoodProduct, ProductSpecies

FOOD_DATA = [
    # ── KOPEK MAMALARI ─────────────────────────────────────────────
    {
        "name": "Adult Medium Breed",
        "brand": "Royal Canin",
        "species": ProductSpecies.DOG,
        "calories_kcal": 362.0, "protein_g": 26.0, "fat_g": 14.0,
        "carbs_g": 40.0, "fiber_g": 4.1, "moisture_percent": 8.0,
        "calcium_mg": 1200.0, "phosphorus_mg": 900.0,
        "allergens": "tavuk,bugday,misir",
        "ingredients": "Tavuk unu, pirinc, misir, tavuk yagi, hidrolize tavuk proteini",
        "is_verified": True, "price_per_kg": 285.0,
    },
    {
        "name": "Adult Small Breed",
        "brand": "Royal Canin",
        "species": ProductSpecies.DOG,
        "calories_kcal": 371.0, "protein_g": 28.0, "fat_g": 16.0,
        "carbs_g": 36.0, "fiber_g": 4.7, "moisture_percent": 8.0,
        "calcium_mg": 1100.0, "phosphorus_mg": 850.0,
        "allergens": "tavuk,bugday",
        "ingredients": "Tavuk unu, pirinc, hayvansal yaglar, hidrolize tavuk proteini",
        "is_verified": True, "price_per_kg": 295.0,
    },
    {
        "name": "Science Plan Adult Medium",
        "brand": "Hills",
        "species": ProductSpecies.DOG,
        "calories_kcal": 341.0, "protein_g": 24.5, "fat_g": 13.0,
        "carbs_g": 42.0, "fiber_g": 3.5, "moisture_percent": 9.5,
        "calcium_mg": 950.0, "phosphorus_mg": 780.0,
        "allergens": "tavuk,misir,soya",
        "ingredients": "Misir, tavuk eti, soya proteini, hayvansal yaglar, vitamin mineral",
        "is_verified": True, "price_per_kg": 260.0,
    },
    {
        "name": "Pro Plan Adult Sensitive",
        "brand": "Purina",
        "species": ProductSpecies.DOG,
        "calories_kcal": 358.0, "protein_g": 29.0, "fat_g": 13.5,
        "carbs_g": 38.0, "fiber_g": 3.0, "moisture_percent": 9.0,
        "calcium_mg": 1050.0, "phosphorus_mg": 820.0,
        "allergens": "sigir,misir",
        "ingredients": "Sigir, pirinc, misir nisastasi, sigir yagi, balik yagi",
        "is_verified": True, "price_per_kg": 220.0,
    },
    {
        "name": "Orijen Original",
        "brand": "Orijen",
        "species": ProductSpecies.DOG,
        "calories_kcal": 389.0, "protein_g": 38.0, "fat_g": 17.0,
        "carbs_g": 19.0, "fiber_g": 4.0, "moisture_percent": 10.0,
        "calcium_mg": 1400.0, "phosphorus_mg": 1100.0,
        "allergens": "balik,tavuk",
        "ingredients": "Taze tavuk, hindi, somon, yumurta, mercan baligi, baklagiller",
        "is_verified": True, "price_per_kg": 380.0,
    },
    {
        "name": "Acana Heritage Free-Run Poultry",
        "brand": "Acana",
        "species": ProductSpecies.DOG,
        "calories_kcal": 373.0, "protein_g": 31.0, "fat_g": 16.0,
        "carbs_g": 25.0, "fiber_g": 5.0, "moisture_percent": 12.0,
        "calcium_mg": 1250.0, "phosphorus_mg": 980.0,
        "allergens": "tavuk,yumurta",
        "ingredients": "Taze tavuk, taze hindi, yumurta, elma, balkabagi, mercimek",
        "is_verified": True, "price_per_kg": 340.0,
    },
    {
        "name": "Ultima Adult Medium",
        "brand": "Ultima",
        "species": ProductSpecies.DOG,
        "calories_kcal": 335.0, "protein_g": 22.0, "fat_g": 11.0,
        "carbs_g": 44.0, "fiber_g": 3.8, "moisture_percent": 10.0,
        "calcium_mg": 900.0, "phosphorus_mg": 720.0,
        "allergens": "tavuk,misir,bugday",
        "ingredients": "Misir, tavuk unu, pirinc, hayvansal yaglar",
        "is_verified": True, "price_per_kg": 125.0,
    },
    {
        "name": "Brit Premium Adult M",
        "brand": "Brit",
        "species": ProductSpecies.DOG,
        "calories_kcal": 345.0, "protein_g": 25.0, "fat_g": 12.0,
        "carbs_g": 40.0, "fiber_g": 3.5, "moisture_percent": 10.0,
        "calcium_mg": 1000.0, "phosphorus_mg": 800.0,
        "allergens": "tavuk,bugday",
        "ingredients": "Tavuk unu, bugday, pirinc, hayvansal yaglar, kurutulmus sebzeler",
        "is_verified": True, "price_per_kg": 155.0,
    },
    {
        "name": "Grainfree Salmon Adult",
        "brand": "Farmina",
        "species": ProductSpecies.DOG,
        "calories_kcal": 355.0, "protein_g": 30.0, "fat_g": 14.0,
        "carbs_g": 28.0, "fiber_g": 4.2, "moisture_percent": 9.0,
        "calcium_mg": 1100.0, "phosphorus_mg": 850.0,
        "allergens": "balik",
        "ingredients": "Somon baligi, patates, bezelye, balik yagi, elma",
        "is_verified": True, "price_per_kg": 300.0,
    },
    {
        "name": "Prolife Adult Lamb & Rice",
        "brand": "Prolife",
        "species": ProductSpecies.DOG,
        "calories_kcal": 340.0, "protein_g": 23.0, "fat_g": 12.0,
        "carbs_g": 42.0, "fiber_g": 3.0, "moisture_percent": 10.0,
        "calcium_mg": 950.0, "phosphorus_mg": 760.0,
        "allergens": "sigir",
        "ingredients": "Kuzu eti, pirinc, hayvansal yaglar, mineral tuzlari",
        "is_verified": True, "price_per_kg": 185.0,
    },

    # ── KEDI MAMALARI ──────────────────────────────────────────────
    {
        "name": "Indoor Adult",
        "brand": "Royal Canin",
        "species": ProductSpecies.CAT,
        "calories_kcal": 348.0, "protein_g": 32.0, "fat_g": 12.0,
        "carbs_g": 33.0, "fiber_g": 8.6, "moisture_percent": 8.0,
        "calcium_mg": 1300.0, "phosphorus_mg": 1000.0,
        "allergens": "tavuk,bugday",
        "ingredients": "Tavuk unu, pirinc, misir, hayvansal yaglar, hidrolize tavuk karacigeri",
        "is_verified": True, "price_per_kg": 310.0,
    },
    {
        "name": "Persian Adult",
        "brand": "Royal Canin",
        "species": ProductSpecies.CAT,
        "calories_kcal": 362.0, "protein_g": 30.0, "fat_g": 15.0,
        "carbs_g": 35.0, "fiber_g": 6.2, "moisture_percent": 8.0,
        "calcium_mg": 1200.0, "phosphorus_mg": 950.0,
        "allergens": "tavuk,misir",
        "ingredients": "Tavuk unu, misir, pirinc, hayvansal yaglar, balik yagi",
        "is_verified": True, "price_per_kg": 320.0,
    },
    {
        "name": "Science Plan Adult Indoor",
        "brand": "Hills",
        "species": ProductSpecies.CAT,
        "calories_kcal": 333.0, "protein_g": 34.0, "fat_g": 11.5,
        "carbs_g": 32.0, "fiber_g": 5.5, "moisture_percent": 9.5,
        "calcium_mg": 1100.0, "phosphorus_mg": 860.0,
        "allergens": "tavuk,misir,soya",
        "ingredients": "Tavuk, misir, soya proteini, balik yagi, vitamin mineral",
        "is_verified": True, "price_per_kg": 275.0,
    },
    {
        "name": "Pro Plan Adult Chicken",
        "brand": "Purina",
        "species": ProductSpecies.CAT,
        "calories_kcal": 370.0, "protein_g": 38.0, "fat_g": 16.0,
        "carbs_g": 22.0, "fiber_g": 3.0, "moisture_percent": 9.0,
        "calcium_mg": 1400.0, "phosphorus_mg": 1100.0,
        "allergens": "tavuk",
        "ingredients": "Tavuk, pirinc, hayvansal yaglar, balik yagi, vitamin mineral",
        "is_verified": True, "price_per_kg": 235.0,
    },
    {
        "name": "Orijen Cat Original",
        "brand": "Orijen",
        "species": ProductSpecies.CAT,
        "calories_kcal": 400.0, "protein_g": 40.0, "fat_g": 18.0,
        "carbs_g": 15.0, "fiber_g": 3.5, "moisture_percent": 10.0,
        "calcium_mg": 1500.0, "phosphorus_mg": 1200.0,
        "allergens": "balik,tavuk,yumurta",
        "ingredients": "Taze tavuk, somon, ringa baligi, yumurta, ordek, mercimek",
        "is_verified": True, "price_per_kg": 395.0,
    },
    {
        "name": "Acana Pacifica Cat",
        "brand": "Acana",
        "species": ProductSpecies.CAT,
        "calories_kcal": 385.0, "protein_g": 37.0, "fat_g": 17.0,
        "carbs_g": 18.0, "fiber_g": 4.0, "moisture_percent": 11.0,
        "calcium_mg": 1350.0, "phosphorus_mg": 1050.0,
        "allergens": "balik",
        "ingredients": "Somon, ringa, somon yagi, mercimek, balkabagi",
        "is_verified": True, "price_per_kg": 355.0,
    },
    {
        "name": "Brit Premium Cat Chicken",
        "brand": "Brit",
        "species": ProductSpecies.CAT,
        "calories_kcal": 352.0, "protein_g": 33.0, "fat_g": 14.0,
        "carbs_g": 30.0, "fiber_g": 3.8, "moisture_percent": 10.0,
        "calcium_mg": 1150.0, "phosphorus_mg": 900.0,
        "allergens": "tavuk",
        "ingredients": "Tavuk unu, pirinc, hayvansal yaglar, sebzeler, vitamin mineral",
        "is_verified": True, "price_per_kg": 160.0,
    },
    {
        "name": "Farmina N&D Grain Free Tuna",
        "brand": "Farmina",
        "species": ProductSpecies.CAT,
        "calories_kcal": 368.0, "protein_g": 36.0, "fat_g": 15.0,
        "carbs_g": 22.0, "fiber_g": 3.2, "moisture_percent": 9.5,
        "calcium_mg": 1200.0, "phosphorus_mg": 950.0,
        "allergens": "balik",
        "ingredients": "Ton baligi, patates, bezelye, balik yagi, elma",
        "is_verified": True, "price_per_kg": 305.0,
    },
    {
        "name": "Ultima Sterilised Adult",
        "brand": "Ultima",
        "species": ProductSpecies.CAT,
        "calories_kcal": 330.0, "protein_g": 30.0, "fat_g": 10.0,
        "carbs_g": 38.0, "fiber_g": 5.0, "moisture_percent": 10.0,
        "calcium_mg": 1000.0, "phosphorus_mg": 800.0,
        "allergens": "tavuk,misir",
        "ingredients": "Misir, tavuk unu, pirinc, hayvansal yaglar",
        "is_verified": True, "price_per_kg": 130.0,
    },
    {
        "name": "Go! Solutions Carnivore Chicken",
        "brand": "Go! Solutions",
        "species": ProductSpecies.CAT,
        "calories_kcal": 378.0, "protein_g": 42.0, "fat_g": 16.0,
        "carbs_g": 12.0, "fiber_g": 3.0, "moisture_percent": 10.0,
        "calcium_mg": 1450.0, "phosphorus_mg": 1150.0,
        "allergens": "tavuk,yumurta",
        "ingredients": "Taze tavuk, yumurta, mercimek, bezelye, elma, balkabagi",
        "is_verified": True, "price_per_kg": 350.0,
    },
]


async def seed_food_products(db: AsyncSession) -> None:
    """Insert or update food products with price data."""
    count_result = await db.execute(select(func.count()).select_from(FoodProduct))
    count = count_result.scalar()

    if count == 0:
        # Fresh seed
        for data in FOOD_DATA:
            product = FoodProduct(**data)
            db.add(product)
        await db.commit()
    else:
        # Update prices if missing
        for data in FOOD_DATA:
            if data.get("price_per_kg"):
                await db.execute(
                    update(FoodProduct)
                    .where(FoodProduct.name == data["name"], FoodProduct.brand == data["brand"])
                    .values(price_per_kg=data["price_per_kg"])
                )
        await db.commit()
