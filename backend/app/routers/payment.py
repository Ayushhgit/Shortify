from fastapi import APIRouter, HTTPException, Request
from app.services.payment_service import create_order
from app.services.payment_service import verify_payment_signature

router = APIRouter(prefix="/payment", tags=["Payment"])

@router.post("/create-order")
def create_payment_order(amount: int):
    try:
        order = create_order(amount_in_rupees=amount)
        return {"order_id": order["id"], "amount": order["amount"], "currency": order["currency"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify")
async def verify_signature(request: Request):
    body = await request.json()

    order_id = body.get("razorpay_order_id")
    payment_id = body.get("razorpay_payment_id")
    signature = body.get("razorpay_signature")

    if not all([order_id, payment_id, signature]):
        raise HTTPException(status_code=400, detail="Missing payment verification fields.")

    is_valid = verify_payment_signature(order_id, payment_id, signature)

    if is_valid:
        return {"success": True, "message": "Payment verified successfully."}
    else:
        raise HTTPException(status_code=400, detail="Invalid signature.")
