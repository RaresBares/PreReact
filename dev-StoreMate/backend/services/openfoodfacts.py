import requests
from types import SimpleNamespace

def fetch_product_data(barcode: str) -> SimpleNamespace | None:
    url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
    try:
        res = requests.get(url, timeout=5)
        data = res.json()
        if data.get("status") == 1:
            p = data["product"]
            return SimpleNamespace(
                name=p.get("product_name"),
                image_url=p.get("image_front_url")
            )
    except:
        pass
    return None
