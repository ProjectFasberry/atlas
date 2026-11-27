import { createEffect } from "solid-js"
import { ClientOnly } from "vike-solid/ClientOnly"
import { appState } from "@/shared/models/app.model"
import { useAtomAccessor } from "@/shared/lib/utils"

const WeatherLayer = () => {
  const weather = useAtomAccessor(appState.selectedWeather)

  createEffect(() => {
    document.documentElement.dataset.weather = weather()
  })

  return <div class={`weather weather-layer ${weather()}`} aria-hidden="true" />
}

/** The weather is a page-wide layer, mounted once by the layout. */
export const WeatherLayerRoot = () => (
  <ClientOnly>
    <WeatherLayer />
  </ClientOnly>
)
