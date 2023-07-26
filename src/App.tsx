import './App.css'

import { Controls, Player } from '@lottiefiles/react-lottie-player'
import ParentSize from '@visx/responsive/lib/components/ParentSize'
import { curveCardinalOpen } from 'd3-shape'
import lottieJson from './assets/example-lottie 1.json'
import { Dataset2D } from './charts/api'
import { LineChart } from './charts/line-chart'

interface ExampleDatum {
    x: number
    y: number
    label: string
}

// Create an array of length 100 for the series prop
const seriesData: ExampleDatum[] = []
for (let i = 0; i < 100; i++) {
    seriesData.push({
        x: i,
        y: Math.abs(Math.sin(i) + Math.random() * 3 + 2 * Math.cos(2 * i)),
        label: `Point ${i + 1}`,
    })
}

// Creating the dataset object
const dataset: Dataset2D<ExampleDatum> = {
    title: 'Sample Dataset',
    subtitle: 'Example data for demonstration',
    styling: { stroke: 'blue', fill: 'transparent' },
    series: seriesData,
    projection: (d) => ({ x: d.x, y: d.y }),
}

function App() {
    return (
        <>
            <div
                style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    width: '1000px',
                    height: '1000px',
                }}
            >
                <ParentSize>
                    {({ width, height }) => (
                        <>
                            <LineChart
                                width={width}
                                height={height}
                                margin={{
                                    top: 100,
                                    left: 100,
                                    right: 100,
                                    bottom: 100,
                                }}
                                datasets={[dataset]}
                                title={'Main title'}
                                subtitle={'subtitle'}
                                xAxisLabel={'x axis label'}
                                yAxisLabel={'y axis label'}
                                lineKind={curveCardinalOpen}
                            />
                            <Player
                                autoplay
                                loop
                                src={lottieJson}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    pointerEvents: 'none',
                                }}
                            >
                                <Controls
                                    visible={false}
                                    buttons={[
                                        'play',
                                        'repeat',
                                        'frame',
                                        'debug',
                                    ]}
                                />
                            </Player>
                        </>
                    )}
                </ParentSize>
            </div>
        </>
    )
}

export default App
