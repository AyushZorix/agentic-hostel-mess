import json
import os

indian_dishes = [
    {
        "name": "Poha",
        "diet": "vegetarian",
        "course": "breakfast",
        "flavor_profile": "mildly spicy & tangy",
        "prep_time": 10,
        "cook_time": 15,
        "ingredients": ["flattened rice", "onions", "peanuts", "mustard seeds", "green chilies", "turmeric", "lemon juice", "curry leaves"],
        "region": "West",
        "state": "Maharashtra",
        "popularity_score": 4.6
    },
    {
        "name": "Idli Sambar & Chutney",
        "diet": "vegetarian",
        "course": "breakfast",
        "flavor_profile": "savory & tangy",
        "prep_time": 20,
        "cook_time": 25,
        "ingredients": ["rice", "urad dal", "toor dal", "drumsticks", "tamarind", "coconut", "mustard seeds", "sambar powder"],
        "region": "South",
        "state": "Tamil Nadu",
        "popularity_score": 4.8
    },
    {
        "name": "Aloo Paratha with Curd & Pickle",
        "diet": "vegetarian",
        "course": "breakfast",
        "flavor_profile": "rich & spicy",
        "prep_time": 25,
        "cook_time": 20,
        "ingredients": ["whole wheat flour", "potatoes", "onions", "green chilies", "garam masala", "butter", "curd", "spices"],
        "region": "North",
        "state": "Punjab",
        "popularity_score": 4.9
    },
    {
        "name": "Upma with Coconut Chutney",
        "diet": "vegetarian",
        "course": "breakfast",
        "flavor_profile": "mild & savory",
        "prep_time": 10,
        "cook_time": 15,
        "ingredients": ["semolina", "mustard seeds", "curry leaves", "ginger", "carrots", "green peas", "coconut", "ghee"],
        "region": "South",
        "state": "Karnataka",
        "popularity_score": 3.7
    },
    {
        "name": "Moong Dal Cheela with Mint Chutney",
        "diet": "vegetarian",
        "course": "breakfast",
        "flavor_profile": "savory & herby",
        "prep_time": 15,
        "cook_time": 15,
        "ingredients": ["yellow moong dal", "paneer stuffing", "ginger", "green chilies", "mint", "coriander", "cumin"],
        "region": "North",
        "state": "Rajasthan",
        "popularity_score": 4.4
    },
    {
        "name": "Masala Dosa with Sambar",
        "diet": "vegetarian",
        "course": "breakfast",
        "flavor_profile": "crisp & savory",
        "prep_time": 20,
        "cook_time": 25,
        "ingredients": ["rice", "urad dal", "potatoes", "onions", "turmeric", "sambar powder", "ghee"],
        "region": "South",
        "state": "Karnataka",
        "popularity_score": 4.9
    },
    {
        "name": "Egg Bhurji with Pav / Bread",
        "diet": "non-vegetarian",
        "course": "breakfast",
        "flavor_profile": "spicy & savory",
        "prep_time": 10,
        "cook_time": 12,
        "ingredients": ["eggs", "onions", "tomatoes", "green chilies", "coriander", "butter", "bread pav"],
        "region": "West",
        "state": "Maharashtra",
        "popularity_score": 4.7
    },
    {
        "name": "Rajma Masala with Steamed Rice",
        "diet": "vegetarian",
        "course": "main course",
        "flavor_profile": "rich & spicy",
        "prep_time": 30,
        "cook_time": 45,
        "ingredients": ["kidney beans", "onions", "tomatoes", "ginger garlic paste", "garam masala", "basmati rice", "coriander"],
        "region": "North",
        "state": "Punjab",
        "popularity_score": 4.8
    },
    {
        "name": "Dal Tadka with Jeera Rice & Roti",
        "diet": "vegetarian",
        "course": "main course",
        "flavor_profile": "comforting & garlicky",
        "prep_time": 15,
        "cook_time": 30,
        "ingredients": ["toor dal", "chana dal", "garlic", "cumin", "tomatoes", "ghee", "whole wheat flour", "rice"],
        "region": "North",
        "state": "Uttar Pradesh",
        "popularity_score": 4.5
    },
    {
        "name": "Paneer Butter Masala with Butter Roti",
        "diet": "vegetarian",
        "course": "main course",
        "flavor_profile": "creamy & mild sweet",
        "prep_time": 20,
        "cook_time": 35,
        "ingredients": ["paneer", "tomatoes", "cashews", "cream", "butter", "kasuri methi", "spices", "whole wheat flour"],
        "region": "North",
        "state": "Punjab",
        "popularity_score": 4.9
    },
    {
        "name": "Chole Bhature / Chole Kulche",
        "diet": "vegetarian",
        "course": "main course",
        "flavor_profile": "tangy & robust spicy",
        "prep_time": 30,
        "cook_time": 40,
        "ingredients": ["chickpeas", "tea leaves", "onions", "tomatoes", "anardana powder", "garam masala", "all-purpose flour"],
        "region": "North",
        "state": "Delhi",
        "popularity_score": 4.9
    },
    {
        "name": "Aloo Gobi Matar with Phulka",
        "diet": "vegetarian",
        "course": "main course",
        "flavor_profile": "homely & spiced",
        "prep_time": 15,
        "cook_time": 25,
        "ingredients": ["potatoes", "cauliflower", "green peas", "tomatoes", "ginger", "turmeric", "cumin", "whole wheat flour"],
        "region": "North",
        "state": "Madhya Pradesh",
        "popularity_score": 3.9
    },
    {
        "name": "Kadhi Pakoda with Steamed Rice",
        "diet": "vegetarian",
        "course": "main course",
        "flavor_profile": "sour & tangy",
        "prep_time": 20,
        "cook_time": 35,
        "ingredients": ["besan gram flour", "sour curd", "onions", "fenugreek seeds", "curry leaves", "red chilies", "rice"],
        "region": "North",
        "state": "Haryana",
        "popularity_score": 3.6
    },
    {
        "name": "Palak Paneer with Missi Roti",
        "diet": "vegetarian",
        "course": "main course",
        "flavor_profile": "earthy & savory",
        "prep_time": 20,
        "cook_time": 25,
        "ingredients": ["spinach", "paneer", "garlic", "ginger", "green chilies", "gram flour", "wheat flour", "ghee"],
        "region": "North",
        "state": "Punjab",
        "popularity_score": 4.7
    },
    {
        "name": "Bhindi Masala with Chapati & Dal Fry",
        "diet": "vegetarian",
        "course": "main course",
        "flavor_profile": "crisp & dry spicy",
        "prep_time": 15,
        "cook_time": 20,
        "ingredients": ["okra", "onions", "amchur powder", "coriander powder", "toor dal", "wheat flour"],
        "region": "West",
        "state": "Gujarat",
        "popularity_score": 4.0
    },
    {
        "name": "Vegetable Biryani with Boondi Raita",
        "diet": "vegetarian",
        "course": "main course",
        "flavor_profile": "aromatic & spiced",
        "prep_time": 25,
        "cook_time": 40,
        "ingredients": ["basmati rice", "carrots", "beans", "peas", "fried onions", "biryani masala", "curd", "boondi"],
        "region": "South",
        "state": "Telangana",
        "popularity_score": 4.8
    },
    {
        "name": "Sambar Rice with Potato Fry & Papad",
        "diet": "vegetarian",
        "course": "main course",
        "flavor_profile": "tangy & spiced",
        "prep_time": 15,
        "cook_time": 30,
        "ingredients": ["rice", "toor dal", "drumsticks", "tamarind", "potatoes", "urad papad", "sambar powder"],
        "region": "South",
        "state": "Tamil Nadu",
        "popularity_score": 4.3
    },
    {
        "name": "Butter Chicken with Naan / Roti",
        "diet": "non-vegetarian",
        "course": "main course",
        "flavor_profile": "rich, creamy & mildly spicy",
        "prep_time": 30,
        "cook_time": 45,
        "ingredients": ["chicken", "butter", "cream", "tomatoes", "cashews", "kasuri methi", "wheat flour"],
        "region": "North",
        "state": "Delhi",
        "popularity_score": 4.9
    },
    {
        "name": "Egg Curry with Jeera Rice & Chapati",
        "diet": "non-vegetarian",
        "course": "main course",
        "flavor_profile": "spicy & savory",
        "prep_time": 15,
        "cook_time": 30,
        "ingredients": ["boiled eggs", "onions", "tomatoes", "ginger garlic", "garam masala", "rice", "wheat flour"],
        "region": "East",
        "state": "West Bengal",
        "popularity_score": 4.5
    },
    {
        "name": "Chicken Curry with Steamed Rice",
        "diet": "non-vegetarian",
        "course": "main course",
        "flavor_profile": "spicy & aromatic",
        "prep_time": 20,
        "cook_time": 40,
        "ingredients": ["chicken", "onions", "tomatoes", "whole spices", "coriander", "mustard oil", "rice"],
        "region": "East",
        "state": "Odisha",
        "popularity_score": 4.7
    },
    {
        "name": "Baingan Bharta with Bajra Roti",
        "diet": "vegetarian",
        "course": "main course",
        "flavor_profile": "smoky & savory",
        "prep_time": 20,
        "cook_time": 30,
        "ingredients": ["roasted eggplant", "onions", "tomatoes", "garlic", "green chilies", "pearl millet flour"],
        "region": "West",
        "state": "Maharashtra",
        "popularity_score": 3.8
    },
    {
        "name": "Mixed Dal Panchmel with Khichdi",
        "diet": "vegetarian",
        "course": "main course",
        "flavor_profile": "wholesome & comforting",
        "prep_time": 15,
        "cook_time": 30,
        "ingredients": ["toor dal", "moong dal", "masoor dal", "urad dal", "chana dal", "rice", "cumin", "ghee"],
        "region": "North",
        "state": "Rajasthan",
        "popularity_score": 4.1
    },
    {
        "name": "Samosa with Tamarind Chutney & Tea",
        "diet": "vegetarian",
        "course": "snack",
        "flavor_profile": "crisp & spicy",
        "prep_time": 20,
        "cook_time": 20,
        "ingredients": ["flour", "potatoes", "green peas", "spices", "oil", "tamarind", "jaggery", "tea leaves", "milk"],
        "region": "North",
        "state": "Uttar Pradesh",
        "popularity_score": 4.9
    },
    {
        "name": "Pav Bhaji with Filter Coffee / Tea",
        "diet": "vegetarian",
        "course": "snack",
        "flavor_profile": "spicy & buttery",
        "prep_time": 20,
        "cook_time": 30,
        "ingredients": ["potatoes", "tomatoes", "capsicum", "peas", "butter", "pav bhaji masala", "bread pav"],
        "region": "West",
        "state": "Maharashtra",
        "popularity_score": 4.9
    },
    {
        "name": "Bread Pakoda with Green Chutney",
        "diet": "vegetarian",
        "course": "snack",
        "flavor_profile": "crispy & savory",
        "prep_time": 15,
        "cook_time": 15,
        "ingredients": ["bread", "gram flour besan", "mashed potatoes", "ajwain", "coriander", "oil"],
        "region": "North",
        "state": "Punjab",
        "popularity_score": 4.4
    },
    {
        "name": "Dhokla with Mustard Tempering",
        "diet": "vegetarian",
        "course": "snack",
        "flavor_profile": "spongy, sweet & tangy",
        "prep_time": 15,
        "cook_time": 20,
        "ingredients": ["gram flour", "eno fruit salt", "green chilies", "mustard seeds", "sugar", "coriander"],
        "region": "West",
        "state": "Gujarat",
        "popularity_score": 4.3
    },
    {
        "name": "Veg Cutlet with Tomato Ketchup",
        "diet": "vegetarian",
        "course": "snack",
        "flavor_profile": "crispy & spiced",
        "prep_time": 20,
        "cook_time": 15,
        "ingredients": ["potatoes", "carrots", "beans", "breadcrumbs", "spices", "oil"],
        "region": "South",
        "state": "Kerala",
        "popularity_score": 4.1
    },
    {
        "name": "Gulab Jamun",
        "diet": "vegetarian",
        "course": "dessert",
        "flavor_profile": "sweet & syrupy",
        "prep_time": 20,
        "cook_time": 25,
        "ingredients": ["khoya milk solids", "flour", "sugar syrup", "cardamom", "rose water", "ghee"],
        "region": "North",
        "state": "West Bengal",
        "popularity_score": 4.9
    },
    {
        "name": "Rice Kheer with Almonds & Cardamom",
        "diet": "vegetarian",
        "course": "dessert",
        "flavor_profile": "rich & aromatic sweet",
        "prep_time": 10,
        "cook_time": 40,
        "ingredients": ["milk", "rice", "sugar", "cardamom", "almonds", "saffron"],
        "region": "North",
        "state": "Bihar",
        "popularity_score": 4.7
    },
    {
        "name": "Moong Dal Halwa",
        "diet": "vegetarian",
        "course": "dessert",
        "flavor_profile": "rich & buttery sweet",
        "prep_time": 20,
        "cook_time": 45,
        "ingredients": ["yellow moong dal", "ghee", "sugar", "milk", "cashews", "cardamom"],
        "region": "North",
        "state": "Rajasthan",
        "popularity_score": 4.8
    },
    {
        "name": "Fruit Custard",
        "diet": "vegetarian",
        "course": "dessert",
        "flavor_profile": "creamy & refreshing sweet",
        "prep_time": 15,
        "cook_time": 15,
        "ingredients": ["milk", "custard powder", "sugar", "apples", "bananas", "pomegranate"],
        "region": "Central",
        "state": "All-India",
        "popularity_score": 4.2
    },
    {
        "name": "Gajar Ka Halwa",
        "diet": "vegetarian",
        "course": "dessert",
        "flavor_profile": "sweet & nutty",
        "prep_time": 25,
        "cook_time": 50,
        "ingredients": ["red carrots", "milk", "sugar", "ghee", "cardamom", "raisins", "cashews"],
        "region": "North",
        "state": "Punjab",
        "popularity_score": 4.9
    }
]

nutrient_database = {
    "Poha": {"portion_g": 200, "calories": 280, "protein_g": 6.2, "carbs_g": 48.5, "fat_g": 7.1, "fiber_g": 3.8, "iron_mg": 4.5, "calcium_mg": 45.0, "source": "USDA-FDC-171052"},
    "Idli Sambar & Chutney": {"portion_g": 320, "calories": 340, "protein_g": 11.5, "carbs_g": 58.0, "fat_g": 6.8, "fiber_g": 6.2, "iron_mg": 3.2, "calcium_mg": 68.0, "source": "USDA-FDC-172184"},
    "Aloo Paratha with Curd & Pickle": {"portion_g": 280, "calories": 420, "protein_g": 9.8, "carbs_g": 62.0, "fat_g": 15.2, "fiber_g": 5.4, "iron_mg": 2.8, "calcium_mg": 120.0, "source": "USDA-FDC-173891"},
    "Upma with Coconut Chutney": {"portion_g": 220, "calories": 290, "protein_g": 7.0, "carbs_g": 44.0, "fat_g": 9.5, "fiber_g": 3.1, "iron_mg": 2.1, "calcium_mg": 38.0, "source": "USDA-FDC-171990"},
    "Moong Dal Cheela with Mint Chutney": {"portion_g": 220, "calories": 310, "protein_g": 16.5, "carbs_g": 42.0, "fat_g": 8.0, "fiber_g": 6.5, "iron_mg": 4.1, "calcium_mg": 85.0, "source": "USDA-FDC-172401"},
    "Masala Dosa with Sambar": {"portion_g": 300, "calories": 380, "protein_g": 9.2, "carbs_g": 64.0, "fat_g": 10.1, "fiber_g": 4.9, "iron_mg": 2.9, "calcium_mg": 52.0, "source": "USDA-FDC-172202"},
    "Egg Bhurji with Pav / Bread": {"portion_g": 240, "calories": 390, "protein_g": 21.0, "carbs_g": 35.0, "fat_g": 18.5, "fiber_g": 2.4, "iron_mg": 3.8, "calcium_mg": 92.0, "source": "USDA-FDC-171287"},
    
    "Rajma Masala with Steamed Rice": {"portion_g": 420, "calories": 520, "protein_g": 19.5, "carbs_g": 86.0, "fat_g": 10.2, "fiber_g": 12.8, "iron_mg": 6.2, "calcium_mg": 110.0, "source": "USDA-FDC-173740"},
    "Dal Tadka with Jeera Rice & Roti": {"portion_g": 450, "calories": 540, "protein_g": 18.2, "carbs_g": 92.0, "fat_g": 11.5, "fiber_g": 10.5, "iron_mg": 5.4, "calcium_mg": 88.0, "source": "USDA-FDC-172445"},
    "Paneer Butter Masala with Butter Roti": {"portion_g": 380, "calories": 640, "protein_g": 24.8, "carbs_g": 52.0, "fat_g": 38.0, "fiber_g": 5.2, "iron_mg": 3.1, "calcium_mg": 340.0, "source": "USDA-FDC-170889"},
    "Chole Bhature / Chole Kulche": {"portion_g": 400, "calories": 680, "protein_g": 18.0, "carbs_g": 96.0, "fat_g": 25.0, "fiber_g": 11.0, "iron_mg": 5.8, "calcium_mg": 95.0, "source": "USDA-FDC-173733"},
    "Aloo Gobi Matar with Phulka": {"portion_g": 380, "calories": 410, "protein_g": 11.2, "carbs_g": 72.0, "fat_g": 8.5, "fiber_g": 9.4, "iron_mg": 4.1, "calcium_mg": 74.0, "source": "USDA-FDC-170420"},
    "Kadhi Pakoda with Steamed Rice": {"portion_g": 420, "calories": 470, "protein_g": 13.5, "carbs_g": 76.0, "fat_g": 12.8, "fiber_g": 4.6, "iron_mg": 2.7, "calcium_mg": 160.0, "source": "USDA-FDC-170912"},
    "Palak Paneer with Missi Roti": {"portion_g": 380, "calories": 530, "protein_g": 25.5, "carbs_g": 48.0, "fat_g": 26.0, "fiber_g": 8.2, "iron_mg": 6.8, "calcium_mg": 410.0, "source": "USDA-FDC-170455"},
    "Bhindi Masala with Chapati & Dal Fry": {"portion_g": 400, "calories": 460, "protein_g": 14.8, "carbs_g": 74.0, "fat_g": 11.0, "fiber_g": 8.6, "iron_mg": 4.9, "calcium_mg": 115.0, "source": "USDA-FDC-170438"},
    "Vegetable Biryani with Boondi Raita": {"portion_g": 420, "calories": 510, "protein_g": 13.2, "carbs_g": 84.0, "fat_g": 14.0, "fiber_g": 7.1, "iron_mg": 3.9, "calcium_mg": 140.0, "source": "USDA-FDC-171880"},
    "Sambar Rice with Potato Fry & Papad": {"portion_g": 420, "calories": 530, "protein_g": 14.0, "carbs_g": 88.0, "fat_g": 13.5, "fiber_g": 8.0, "iron_mg": 4.3, "calcium_mg": 82.0, "source": "USDA-FDC-172210"},
    "Butter Chicken with Naan / Roti": {"portion_g": 420, "calories": 670, "protein_g": 38.5, "carbs_g": 54.0, "fat_g": 34.0, "fiber_g": 4.1, "iron_mg": 4.2, "calcium_mg": 130.0, "source": "USDA-FDC-171099"},
    "Egg Curry with Jeera Rice & Chapati": {"portion_g": 430, "calories": 560, "protein_g": 24.2, "carbs_g": 78.0, "fat_g": 16.5, "fiber_g": 5.8, "iron_mg": 4.8, "calcium_mg": 110.0, "source": "USDA-FDC-171295"},
    "Chicken Curry with Steamed Rice": {"portion_g": 440, "calories": 590, "protein_g": 36.0, "carbs_g": 72.0, "fat_g": 17.5, "fiber_g": 4.2, "iron_mg": 4.5, "calcium_mg": 70.0, "source": "USDA-FDC-171105"},
    "Baingan Bharta with Bajra Roti": {"portion_g": 360, "calories": 430, "protein_g": 11.5, "carbs_g": 68.0, "fat_g": 12.0, "fiber_g": 11.2, "iron_mg": 5.6, "calcium_mg": 92.0, "source": "USDA-FDC-170410"},
    "Mixed Dal Panchmel with Khichdi": {"portion_g": 420, "calories": 480, "protein_g": 19.8, "carbs_g": 78.0, "fat_g": 10.0, "fiber_g": 9.5, "iron_mg": 5.1, "calcium_mg": 95.0, "source": "USDA-FDC-172460"},

    "Samosa with Tamarind Chutney & Tea": {"portion_g": 160, "calories": 310, "protein_g": 5.2, "carbs_g": 42.0, "fat_g": 14.5, "fiber_g": 3.0, "iron_mg": 1.9, "calcium_mg": 40.0, "source": "USDA-FDC-171840"},
    "Pav Bhaji with Filter Coffee / Tea": {"portion_g": 240, "calories": 390, "protein_g": 8.5, "carbs_g": 54.0, "fat_g": 16.0, "fiber_g": 6.2, "iron_mg": 3.4, "calcium_mg": 65.0, "source": "USDA-FDC-171860"},
    "Bread Pakoda with Green Chutney": {"portion_g": 170, "calories": 330, "protein_g": 7.4, "carbs_g": 41.0, "fat_g": 15.5, "fiber_g": 3.5, "iron_mg": 2.2, "calcium_mg": 48.0, "source": "USDA-FDC-171872"},
    "Dhokla with Mustard Tempering": {"portion_g": 160, "calories": 210, "protein_g": 8.2, "carbs_g": 32.0, "fat_g": 5.5, "fiber_g": 4.1, "iron_mg": 2.4, "calcium_mg": 42.0, "source": "USDA-FDC-172430"},
    "Veg Cutlet with Tomato Ketchup": {"portion_g": 150, "calories": 250, "protein_g": 4.8, "carbs_g": 36.0, "fat_g": 10.0, "fiber_g": 4.5, "iron_mg": 2.0, "calcium_mg": 35.0, "source": "USDA-FDC-171885"},

    "Gulab Jamun": {"portion_g": 100, "calories": 320, "protein_g": 4.1, "carbs_g": 52.0, "fat_g": 11.0, "fiber_g": 0.5, "iron_mg": 0.6, "calcium_mg": 120.0, "source": "USDA-FDC-171910"},
    "Rice Kheer with Almonds & Cardamom": {"portion_g": 150, "calories": 240, "protein_g": 6.5, "carbs_g": 36.0, "fat_g": 7.8, "fiber_g": 1.0, "iron_mg": 0.8, "calcium_mg": 180.0, "source": "USDA-FDC-171925"},
    "Moong Dal Halwa": {"portion_g": 120, "calories": 360, "protein_g": 7.2, "carbs_g": 46.0, "fat_g": 17.0, "fiber_g": 3.2, "iron_mg": 1.8, "calcium_mg": 70.0, "source": "USDA-FDC-171932"},
    "Fruit Custard": {"portion_g": 160, "calories": 180, "protein_g": 4.2, "carbs_g": 32.0, "fat_g": 4.1, "fiber_g": 2.2, "iron_mg": 0.7, "calcium_mg": 110.0, "source": "USDA-FDC-171940"},
    "Gajar Ka Halwa": {"portion_g": 140, "calories": 310, "protein_g": 5.4, "carbs_g": 44.0, "fat_g": 13.0, "fiber_g": 3.5, "iron_mg": 1.4, "calcium_mg": 140.0, "source": "USDA-FDC-171950"}
}

vendor_catalog = [
    {"item": "Atta (Whole Wheat Flour)", "category": "Grains & Flour", "unit": "kg", "unit_price_inr": 34.0, "bulk_threshold": 250, "bulk_price_inr": 31.0, "shelf_life_days": 90, "supplier": "Shree Ganesh Agro", "lead_time_days": 1},
    {"item": "Basmati Sella Rice", "category": "Grains & Flour", "unit": "kg", "unit_price_inr": 58.0, "bulk_threshold": 300, "bulk_price_inr": 52.0, "shelf_life_days": 180, "supplier": "Shree Ganesh Agro", "lead_time_days": 1},
    {"item": "Poha (Flattened Rice)", "category": "Grains & Flour", "unit": "kg", "unit_price_inr": 42.0, "bulk_threshold": 100, "bulk_price_inr": 38.0, "shelf_life_days": 60, "supplier": "Shree Ganesh Agro", "lead_time_days": 1},
    {"item": "Sooji / Rava (Semolina)", "category": "Grains & Flour", "unit": "kg", "unit_price_inr": 38.0, "bulk_threshold": 100, "bulk_price_inr": 35.0, "shelf_life_days": 60, "supplier": "Shree Ganesh Agro", "lead_time_days": 1},
    {"item": "Besan (Gram Flour)", "category": "Grains & Flour", "unit": "kg", "unit_price_inr": 76.0, "bulk_threshold": 80, "bulk_price_inr": 70.0, "shelf_life_days": 60, "supplier": "Shree Ganesh Agro", "lead_time_days": 1},
    
    {"item": "Toor Dal (Arhar)", "category": "Pulses & Legumes", "unit": "kg", "unit_price_inr": 145.0, "bulk_threshold": 150, "bulk_price_inr": 136.0, "shelf_life_days": 120, "supplier": "Kisan Pulse Mill", "lead_time_days": 2},
    {"item": "Chana Dal", "category": "Pulses & Legumes", "unit": "kg", "unit_price_inr": 88.0, "bulk_threshold": 100, "bulk_price_inr": 82.0, "shelf_life_days": 120, "supplier": "Kisan Pulse Mill", "lead_time_days": 2},
    {"item": "Rajma (Chitra Kidney Beans)", "category": "Pulses & Legumes", "unit": "kg", "unit_price_inr": 135.0, "bulk_threshold": 80, "bulk_price_inr": 124.0, "shelf_life_days": 180, "supplier": "Kisan Pulse Mill", "lead_time_days": 2},
    {"item": "Kabuli Chana (Chickpeas)", "category": "Pulses & Legumes", "unit": "kg", "unit_price_inr": 110.0, "bulk_threshold": 100, "bulk_price_inr": 102.0, "shelf_life_days": 180, "supplier": "Kisan Pulse Mill", "lead_time_days": 2},
    {"item": "Moong Dal (Yellow Split)", "category": "Pulses & Legumes", "unit": "kg", "unit_price_inr": 115.0, "bulk_threshold": 100, "bulk_price_inr": 108.0, "shelf_life_days": 120, "supplier": "Kisan Pulse Mill", "lead_time_days": 2},
    {"item": "Urad Dal Gota", "category": "Pulses & Legumes", "unit": "kg", "unit_price_inr": 128.0, "bulk_threshold": 80, "bulk_price_inr": 120.0, "shelf_life_days": 120, "supplier": "Kisan Pulse Mill", "lead_time_days": 2},

    {"item": "Fresh Malai Paneer", "category": "Dairy", "unit": "kg", "unit_price_inr": 340.0, "bulk_threshold": 50, "bulk_price_inr": 315.0, "shelf_life_days": 3, "supplier": "Amul Cooperative Wholesaler", "lead_time_days": 1},
    {"item": "Pasteurized Toned Milk", "category": "Dairy", "unit": "L", "unit_price_inr": 54.0, "bulk_threshold": 150, "bulk_price_inr": 51.0, "shelf_life_days": 2, "supplier": "Amul Cooperative Wholesaler", "lead_time_days": 1},
    {"item": "Plain Curd / Dahi", "category": "Dairy", "unit": "kg", "unit_price_inr": 62.0, "bulk_threshold": 80, "bulk_price_inr": 56.0, "shelf_life_days": 4, "supplier": "Amul Cooperative Wholesaler", "lead_time_days": 1},
    {"item": "Desi Ghee (Pure Butterfat)", "category": "Dairy", "unit": "kg", "unit_price_inr": 540.0, "bulk_threshold": 30, "bulk_price_inr": 510.0, "shelf_life_days": 180, "supplier": "Amul Cooperative Wholesaler", "lead_time_days": 2},
    {"item": "Table Butter", "category": "Dairy", "unit": "kg", "unit_price_inr": 460.0, "bulk_threshold": 25, "bulk_price_inr": 435.0, "shelf_life_days": 60, "supplier": "Amul Cooperative Wholesaler", "lead_time_days": 1},

    {"item": "Potatoes (Agra Special)", "category": "Vegetables", "unit": "kg", "unit_price_inr": 22.0, "bulk_threshold": 200, "bulk_price_inr": 18.0, "shelf_life_days": 20, "supplier": "Azadpur Mandi Direct", "lead_time_days": 1},
    {"item": "Red Onions (Nashik Medium)", "category": "Vegetables", "unit": "kg", "unit_price_inr": 28.0, "bulk_threshold": 200, "bulk_price_inr": 24.0, "shelf_life_days": 25, "supplier": "Azadpur Mandi Direct", "lead_time_days": 1},
    {"item": "Hybrid Tomatoes", "category": "Vegetables", "unit": "kg", "unit_price_inr": 36.0, "bulk_threshold": 150, "bulk_price_inr": 30.0, "shelf_life_days": 4, "supplier": "Azadpur Mandi Direct", "lead_time_days": 1},
    {"item": "Cauliflower", "category": "Vegetables", "unit": "kg", "unit_price_inr": 32.0, "bulk_threshold": 80, "bulk_price_inr": 26.0, "shelf_life_days": 4, "supplier": "Azadpur Mandi Direct", "lead_time_days": 1},
    {"item": "Fresh Spinach (Palak)", "category": "Vegetables", "unit": "kg", "unit_price_inr": 35.0, "bulk_threshold": 50, "bulk_price_inr": 28.0, "shelf_life_days": 2, "supplier": "Azadpur Mandi Direct", "lead_time_days": 1},
    {"item": "Green Peas (Frozen / Fresh)", "category": "Vegetables", "unit": "kg", "unit_price_inr": 80.0, "bulk_threshold": 60, "bulk_price_inr": 72.0, "shelf_life_days": 60, "supplier": "Azadpur Mandi Direct", "lead_time_days": 1},
    {"item": "Okra (Bhindi)", "category": "Vegetables", "unit": "kg", "unit_price_inr": 45.0, "bulk_threshold": 60, "bulk_price_inr": 38.0, "shelf_life_days": 3, "supplier": "Azadpur Mandi Direct", "lead_time_days": 1},
    {"item": "Ginger & Garlic Mix", "category": "Vegetables", "unit": "kg", "unit_price_inr": 120.0, "bulk_threshold": 30, "bulk_price_inr": 105.0, "shelf_life_days": 14, "supplier": "Azadpur Mandi Direct", "lead_time_days": 1},

    {"item": "Refined Mustard / Sunflower Oil", "category": "Oils & Spices", "unit": "L", "unit_price_inr": 130.0, "bulk_threshold": 100, "bulk_price_inr": 120.0, "shelf_life_days": 180, "supplier": "National Spices & Oils", "lead_time_days": 2},
    {"item": "Indian Spice Box Combo", "category": "Oils & Spices", "unit": "kg", "unit_price_inr": 290.0, "bulk_threshold": 20, "bulk_price_inr": 260.0, "shelf_life_days": 180, "supplier": "National Spices & Oils", "lead_time_days": 2},
    {"item": "Sugar (M-30 Grade)", "category": "Pantry Staples", "unit": "kg", "unit_price_inr": 42.0, "bulk_threshold": 100, "bulk_price_inr": 39.0, "shelf_life_days": 365, "supplier": "National Spices & Oils", "lead_time_days": 2},
    {"item": "CTC Dust Tea Leaves", "category": "Pantry Staples", "unit": "kg", "unit_price_inr": 280.0, "bulk_threshold": 25, "bulk_price_inr": 250.0, "shelf_life_days": 180, "supplier": "National Spices & Oils", "lead_time_days": 2},

    {"item": "Fresh Farm Eggs", "category": "Non-Veg & Poultry", "unit": "tray (30 eggs)", "unit_price_inr": 175.0, "bulk_threshold": 35, "bulk_price_inr": 158.0, "shelf_life_days": 12, "supplier": "Venkateshwara Hatcheries", "lead_time_days": 1},
    {"item": "Broiler Chicken (Curry Cut)", "category": "Non-Veg & Poultry", "unit": "kg", "unit_price_inr": 195.0, "bulk_threshold": 80, "bulk_price_inr": 178.0, "shelf_life_days": 1, "supplier": "Venkateshwara Hatcheries", "lead_time_days": 1}
]

mess_inventory = [
    {"item": "Hybrid Tomatoes", "quantity": 48.0, "unit": "kg", "days_to_expiry": 2, "batch_id": "BATCH-TOM-0907", "reorder_point": 30.0, "urgency": "CRITICAL_LEFTOVER"},
    {"item": "Cauliflower", "quantity": 35.0, "unit": "kg", "days_to_expiry": 2, "batch_id": "BATCH-CAU-0907", "reorder_point": 20.0, "urgency": "CRITICAL_LEFTOVER"},
    {"item": "Fresh Spinach (Palak)", "quantity": 24.0, "unit": "kg", "days_to_expiry": 1, "batch_id": "BATCH-PLK-0908", "reorder_point": 15.0, "urgency": "URGENT_USE_TODAY"},
    {"item": "Plain Curd / Dahi", "quantity": 45.0, "unit": "kg", "days_to_expiry": 2, "batch_id": "BATCH-CRD-0907", "reorder_point": 25.0, "urgency": "CRITICAL_LEFTOVER"},
    {"item": "Potatoes (Agra Special)", "quantity": 180.0, "unit": "kg", "days_to_expiry": 16, "batch_id": "BATCH-POT-0901", "reorder_point": 50.0, "urgency": "STABLE"},
    {"item": "Red Onions (Nashik Medium)", "quantity": 140.0, "unit": "kg", "days_to_expiry": 20, "batch_id": "BATCH-ONI-0901", "reorder_point": 40.0, "urgency": "STABLE"},
    {"item": "Atta (Whole Wheat Flour)", "quantity": 320.0, "unit": "kg", "days_to_expiry": 75, "batch_id": "BATCH-WHT-0820", "reorder_point": 100.0, "urgency": "STABLE"},
    {"item": "Basmati Sella Rice", "quantity": 280.0, "unit": "kg", "days_to_expiry": 150, "batch_id": "BATCH-RIC-0815", "reorder_point": 80.0, "urgency": "STABLE"},
    {"item": "Toor Dal (Arhar)", "quantity": 85.0, "unit": "kg", "days_to_expiry": 90, "batch_id": "BATCH-DAL-0822", "reorder_point": 30.0, "urgency": "STABLE"},
    {"item": "Rajma (Chitra Kidney Beans)", "quantity": 60.0, "unit": "kg", "days_to_expiry": 140, "batch_id": "BATCH-RJM-0810", "reorder_point": 25.0, "urgency": "STABLE"},
    {"item": "Refined Mustard / Sunflower Oil", "quantity": 75.0, "unit": "L", "days_to_expiry": 160, "batch_id": "BATCH-OIL-0805", "reorder_point": 25.0, "urgency": "STABLE"}
]

os.makedirs("data", exist_ok=True)

with open("data/indian_food_101.json", "w") as f:
    json.dump(indian_dishes, f, indent=2)

with open("data/usda_nutrients.json", "w") as f:
    json.dump(nutrient_database, f, indent=2)

with open("data/vendor_prices.json", "w") as f:
    json.dump(vendor_catalog, f, indent=2)

with open("data/mess_inventory.json", "w") as f:
    json.dump(mess_inventory, f, indent=2)

print("Datasets written successfully.")
