"""
FastAPI server exposing endpoints for the Maku Supabase Action.

This application connects to a Supabase project using the service role key
and provides a few routes to check a traveller's balance, top up their
account and view itineraries.  It is designed to be imported into
OpenAI's GPT Actions by way of the accompanying `openapi.yaml`.
"""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

try:
    # Optional dependency to load environment variables from a `.env` file.
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
except Exception:
    # It's fine if the file does not exist; environment variables may come from
    # the deployment platform.
    pass

from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError(
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment."
    )

# Initialise the Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

app = FastAPI(
    title="Maku Supabase Action",
    description=(
        "API for checking balances, topping up funds and retrieving itineraries "
        "for Maku Travel customers."
    ),
    version="0.1.0",
)

# Configure CORS using environment variable ALLOWED_ORIGINS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class TopupRequest(BaseModel):
    """Request body for topping up funds."""

    user_id: str = Field(..., description="Unique identifier of the user.")
    amount: float = Field(..., gt=0, description="Amount to add to the balance.")
    description: Optional[str] = Field(
        None, description="Optional description or reference for the top‑up."
    )


@app.get("/healthz", summary="Health check")
async def healthz() -> Dict[str, str]:
    """Simple health check endpoint."""
    return {"status": "ok"}


@app.get("/funds/balance", summary="Get account balance")
async def get_balance(user_id: str) -> Dict[str, Any]:
    """Return the current balance for the given user.

    Args:
        user_id: Unique identifier of the user.

    Returns:
        A dictionary containing the user_id and current balance.
    """
    # Query the funds table for the user's balance
    result = (
        supabase.table("funds")
        .select("user_id,balance")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    if result.error:
        # Propagate any database errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {result.error.message}",
        )
    record = result.data
    if not record:
        # If no record exists, return zero balance
        return {"user_id": user_id, "balance": 0}
    return record


@app.post("/funds/topup", summary="Top up account balance")
async def top_up(request: TopupRequest) -> Dict[str, Any]:
    """Increase the balance for a user by the specified amount.

    Args:
        request: Body containing user_id, amount and optional description.

    Returns:
        A dictionary containing the new balance.
    """
    # Fetch current balance
    result = (
        supabase.table("funds")
        .select("user_id,balance")
        .eq("user_id", request.user_id)
        .maybe_single()
        .execute()
    )
    if result.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {result.error.message}",
        )
    record = result.data
    if record:
        # Update existing record
        new_balance = float(record["balance"]) + request.amount
        update = (
            supabase.table("funds")
            .update({"balance": new_balance})
            .eq("user_id", request.user_id)
            .execute()
        )
        if update.error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {update.error.message}",
            )
    else:
        # Insert new record
        new_balance = request.amount
        insert = (
            supabase.table("funds")
            .insert({"user_id": request.user_id, "balance": new_balance})
            .execute()
        )
        if insert.error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {insert.error.message}",
            )
    return {"user_id": request.user_id, "balance": new_balance}


@app.get(
    "/itineraries/{user_id}", summary="List itineraries for a user", response_model=List[Dict[str, Any]]
)
async def list_itineraries(user_id: str) -> List[Dict[str, Any]]:
    """Return all itinerary records for the given user.

    Args:
        user_id: Unique identifier of the user.

    Returns:
        A list of itinerary objects.
    """
    result = (
        supabase.table("itineraries")
        .select("id,user_id,data")
        .eq("user_id", user_id)
        .execute()
    )
    if result.error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {result.error.message}",
        )
    return result.data or []
