export async function fetchForecast(
  uid: string
): Promise<ForecastResponse | null> {
  try {
    const response = await fetch("http://10.0.2.2:8000/forecast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ uid })
    })

    if (!response.ok) {
      throw new Error("Failed to fetch forecast")
    }

    return await response.json()
  } catch (error) {
    console.error("Forecast error:", error)
    return null
  }
}

export type ForecastResponse = {
  next_month: number
  prediction: number
  mean: number
  status: string
}
