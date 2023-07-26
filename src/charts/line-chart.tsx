'use client'
// import { type Measurement } from '@/models/measurements';

import { AxisBottom, AxisLeft, TickFormatter } from '@visx/axis'
import { localPoint } from '@visx/event'
import { GlyphCircle } from '@visx/glyph'
import { GradientOrangeRed } from '@visx/gradient'
import { Grid } from '@visx/grid'
import { Group } from '@visx/group'
import {
    MarkerArrow,
    MarkerCircle,
    MarkerCross,
    MarkerLine,
    MarkerX,
} from '@visx/marker'
import { PatternLines } from '@visx/pattern'
import { NumberLike, scaleLinear, scaleOrdinal } from '@visx/scale'
import { TooltipWithBounds, useTooltip } from '@visx/tooltip'
import { voronoi } from '@visx/voronoi'
import { Margin } from '@visx/xychart'
import { type CurveFactory, type CurveFactoryLineOnly } from 'd3-shape'
import { motion } from 'framer-motion'
import {
    PointerEvent,
    TouchEvent,
    useCallback,
    useMemo,
    useRef,
    useState,
} from 'react'
import { useClickOutside } from '../hooks/use-click-outside'
import { blues, purples } from './colours'

import { line } from '@visx/shape'
import { Chart2D } from './api'
import {
    BG_PATTERN_ID,
    CHART_FONT_SIZES,
    SELECTION_PATTERN_ID,
} from './constants'

/// Tooltips

type LineTooltipPayload = { tag: 'line-tooltip'; data: any }

const lineTooltipPayload = (
    data: LineTooltipPayload['data']
): LineTooltipPayload => ({ tag: 'line-tooltip', data })

const LineTooltip = ({ data }: { data: LineTooltipPayload['data'] }) => {
    return (
        <div>
            <span>LineTooltip</span>
        </div>
    )
}

type TooltipPayload = LineTooltipPayload

const renderTooltip = (payload: TooltipPayload) => {
    switch (payload.tag) {
        case 'line-tooltip':
            return <LineTooltip data={payload.data} />
    }
}

////

type XY = { x: number; y: number }

type LineChartProps<Datum extends object> = {
    width: number
    height: number
    margin: Margin
    xAxisLabel: string
    yAxisLabel: string
    lineKind: CurveFactory | CurveFactoryLineOnly
} & Chart2D<Datum>

const LineChart = <Datum extends object>({
    width,
    height,
    margin,
    datasets,
    title,
    subtitle,
    xAxisLabel,
    yAxisLabel,
    lineKind,
}: LineChartProps<Datum>) => {
    const INNER_CHART_PADDING_TOP = 50

    const innerWidth = useMemo(
        () => width - margin.left - margin.right,
        [width, margin]
    )
    const innerHeight = useMemo(
        () => height - margin.top - margin.bottom,
        [height, margin]
    )

    const xys = useMemo(
        () =>
            Object.values(datasets)
                .map(({ series, projection }) => series.map(projection))
                .flat(),
        [datasets]
    )

    const xs = useMemo(() => xys.map((xy) => xy.x), [xys])
    const ys = useMemo(() => xys.map((xy) => xy.y), [xys])

    const minX = useMemo(() => Math.min(...xs), [xs])
    const maxX = useMemo(() => Math.max(...xs), [xs])
    const minY = useMemo(() => Math.min(...ys), [ys])
    const maxY = useMemo(() => Math.max(...ys), [ys])

    const xScale = useMemo(() => {
        return scaleLinear({
            domain: [minX, maxX],
            range: [0, innerWidth],
            round: true,
        })
    }, [innerWidth, minX, maxX])

    const yScale = useMemo(() => {
        return scaleLinear({
            domain: [0, maxY],
            range: [innerHeight, INNER_CHART_PADDING_TOP],
            round: true,
        })
    }, [innerHeight, maxY])

    const lineOrdinalScale = useMemo(() => {
        const lineColorPairs = Object.entries(datasets).map(([k, v]) => [
            k,
            v.styling.stroke,
        ])

        return scaleOrdinal({
            domain: lineColorPairs.map((x) => x[0]),
            range: lineColorPairs.map((x) => x[1]),
        })
    }, [datasets])

    const voronoiLayout = useMemo(
        () =>
            voronoi<{ x: number; y: number }>({
                x: (d) => xScale(d.x) ?? 0,
                y: (d) => yScale(d.y) ?? 0,
                width: innerWidth,
                height: innerHeight,
            })(xys),
        [innerWidth, innerHeight, xScale, yScale, xys]
    )

    const polygons = voronoiLayout.polygons() // equivalent to voronoiLayout.polygons(points)

    const xTickFormatter: TickFormatter<NumberLike> = (
        value,
        index,
        values
    ) => {
        // const rounded = Math.round(value.valueOf());

        return `${value}`
    }
    const yTickFormatter: TickFormatter<NumberLike> = (
        value,
        index,
        values
    ) => {
        // const rounded = Math.round(value.valueOf());

        return `${value}`
    }

    const {
        hideTooltip,
        showTooltip,
        tooltipOpen,
        tooltipData,
        tooltipLeft = 0,
        tooltipTop = 0,
    } = useTooltip<TooltipPayload>()

    const htmlContainerRef = useRef<HTMLDivElement>(null)

    const [isHovered, setHovered] = useState(false)

    const handleMovePointer = useCallback(
        (event: PointerEvent<SVGRectElement> | TouchEvent<SVGRectElement>) => {
            const point = localPoint(event)

            if (!point) return

            const neighborRadius = innerHeight
            const closest = voronoiLayout.find(point.x, point.y, neighborRadius)

            if (closest) {
                showTooltip({
                    tooltipLeft: xScale(closest.data.x),
                    tooltipTop: yScale(closest.data.y),
                    tooltipData: lineTooltipPayload(closest.data),
                })
            }
        },
        [xScale, yScale, voronoiLayout]
    )

    const handleClickOutside = useCallback(() => {
        hideTooltip()
    }, [])

    useClickOutside(htmlContainerRef, handleClickOutside)

    const [hoveredLineKey, setHoveredLineKey] = useState('')

    return (
        <motion.div
            ref={htmlContainerRef}
            style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                width: '100%',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <svg
                width={width}
                height={height}
                style={{ resize: 'both', overflow: 'auto' }}
            >
                <GradientOrangeRed id="voronoi_orange_red" />

                <MarkerX
                    id="marker-x"
                    stroke="#333"
                    size={22}
                    strokeWidth={4}
                    markerUnits="userSpaceOnUse"
                />
                <MarkerCross
                    id="marker-cross"
                    stroke="#333"
                    size={22}
                    strokeWidth={4}
                    strokeOpacity={0.6}
                    markerUnits="userSpaceOnUse"
                />
                <MarkerCircle
                    id="marker-circle"
                    fill="#333"
                    size={2}
                    refX={2}
                />
                <MarkerArrow
                    id="marker-arrow-odd"
                    stroke="#333"
                    size={8}
                    strokeWidth={1}
                />
                <MarkerLine
                    id="marker-line"
                    fill="#333"
                    size={16}
                    strokeWidth={1}
                />
                <MarkerArrow id="marker-arrow" fill="#333" refX={2} size={6} />
                <PatternLines
                    id={BG_PATTERN_ID}
                    width={16}
                    height={16}
                    orientation={['diagonal']}
                    stroke={'grey'}
                    strokeWidth={1}
                />
                <PatternLines
                    id={SELECTION_PATTERN_ID}
                    width={16}
                    height={16}
                    orientation={['diagonal']}
                    stroke={purples[2]}
                    strokeWidth={5}
                    background={purples[3]}
                />
                <defs>
                    <filter id="my-filter">
                        <feGaussianBlur stdDeviation="1" />
                        <feColorMatrix
                            type="matrix"
                            values="1.2 0 0 0 0
                      0 1.2 0 0 0
                      0 0 1.2 0 0
                      0 0 0 1 0"
                        />
                        <feComponentTransfer>
                            <feFuncR type="gamma" amplitude="2.2" />
                            <feFuncG type="gamma" amplitude="2.2" />
                            <feFuncB type="gamma" amplitude="2.2" />
                        </feComponentTransfer>
                        <feBlend mode="multiply" />
                    </filter>

                    <filter x="0" y="0" width="1" height="1" id="solid">
                        <feFlood floodColor="#f5fbff" result="bg" />
                        <feMerge>
                            <feMergeNode in="bg" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                        {/* <feComposite in="SourceGraphic" operator="xor" /> */}
                    </filter>
                </defs>

                <rect
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    fill="transparent"
                    onPointerMove={handleMovePointer}
                    onPointerLeave={handleClickOutside}
                    // onPointerDown={handleClickOutside}
                    // onPointerMove={handleMovePointer}
                />

                <motion.rect
                    x={margin.left}
                    y={margin.top}
                    width={innerWidth}
                    height={innerHeight}
                    fill={`url(#${BG_PATTERN_ID})`}
                    fillOpacity={0.3}
                    pointerEvents={'none'}
                    initial={false}
                    animate={{ stdDeviation: isHovered ? 0 : 10 }}
                    filter="url(#my-filter)"
                />

                <text
                    x="50%"
                    y={(margin?.top ?? 20) / 2}
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fontSize={CHART_FONT_SIZES.chartHeadings}
                    fontWeight={'bold'}
                    fill={blues[0]}
                    fontFamily="Noto Sans"
                >
                    {title}
                </text>

                <Group top={margin.top} left={margin.left}>
                    {/* {polygons.map((polygon, idx) => (
                        <VoronoiPolygon key={`${idx}`} polygon={polygon} fill={
                            'url(#voronoi_orange_red)'

                        }
                            stroke="#fff"
                            strokeWidth={1} />
                    ))} */}

                    <Grid
                        xScale={xScale}
                        yScale={yScale}
                        numTicksColumns={0}
                        width={innerWidth}
                        height={innerHeight}
                        stroke="black"
                        strokeOpacity={0.1}
                    />

                    {Object.entries(datasets).map(
                        (
                            [
                                seriesName,
                                {
                                    title,
                                    subtitle,
                                    series,
                                    projection,
                                    styling: { stroke, fill },
                                },
                            ],
                            i
                        ) => {
                            const xAccessor = (d: XY) => xScale(d.x)
                            const yAccessor = (d: XY) => yScale(d.y)

                            const pathFn = line({
                                x: xAccessor,
                                y: yAccessor,
                                curve: lineKind,
                            })

                            return (
                                <>
                                    <motion.path
                                        key={`${title}-line-${i}`}
                                        d={pathFn(series.map(projection)) || ''}
                                        fill={fill}
                                        // without this a datum surrounded by nulls will not be visible
                                        // https://github.com/d3/d3-shape#line_defined
                                        strokeLinecap="round"
                                        pointerEvents={'none'}
                                        shapeRendering="geometricPrecision"
                                        markerMid="url(#marker-circle)"
                                        stroke={
                                            hoveredLineKey === seriesName
                                                ? 'grey'
                                                : stroke
                                        }
                                        opacity={0.6}
                                        strokeWidth={1.5}
                                    />
                                </>
                            )
                        }
                    )}

                    {tooltipData && (
                        <g>
                            <motion.line
                                x1={tooltipLeft}
                                y1={innerHeight}
                                x2={tooltipLeft}
                                y2={tooltipTop}
                                //   fill={fill}
                                stroke={'grey'}
                                strokeWidth={2}
                                pointerEvents="none"
                                strokeDasharray="4,2"
                            />
                            <motion.line
                                x1={0}
                                y1={tooltipTop}
                                x2={tooltipLeft}
                                y2={tooltipTop}
                                //   fill={fill}
                                stroke={'grey'}
                                strokeWidth={2}
                                pointerEvents="none"
                                strokeDasharray="4,2"
                            />
                        </g>
                    )}
                    {tooltipData && (
                        <g>
                            <GlyphCircle
                                left={tooltipLeft}
                                top={yScale(tooltipData.data.y)}
                                size={110}
                                fill={'black'}
                                stroke={'white'}
                                strokeWidth={2}
                            />
                        </g>
                    )}

                    <AxisBottom
                        top={innerHeight}
                        key={'x-axis'}
                        label={xAxisLabel}
                        scale={xScale}
                        tickFormat={xTickFormatter}
                        labelOffset={20}
                        labelProps={{
                            fontSize: CHART_FONT_SIZES.axisLabels,
                            verticalAnchor: 'middle',
                            textAnchor: 'middle',
                            fontFamily: 'Noto Sans',
                        }}
                        tickLabelProps={{
                            fontSize: CHART_FONT_SIZES.axisTickLabels,
                            fontFamily: 'Noto Sans',
                        }}
                        numTicks={25}
                    />
                    <AxisLeft
                        key={'y-axis'}
                        label={yAxisLabel}
                        labelOffset={40}
                        scale={yScale}
                        tickFormat={yTickFormatter}
                        labelProps={{
                            fontSize: CHART_FONT_SIZES.axisLabels,
                            verticalAnchor: 'middle',
                            textAnchor: 'middle',
                            fontFamily: 'Noto Sans',
                        }}
                        tickLabelProps={{
                            fontSize: CHART_FONT_SIZES.axisTickLabels,
                            fontFamily: 'Noto Sans',
                        }}
                    />
                </Group>
            </svg>

            {tooltipOpen && tooltipData && (
                <TooltipWithBounds top={tooltipTop} left={tooltipLeft}>
                    {renderTooltip(tooltipData)}
                </TooltipWithBounds>
            )}
        </motion.div>
    )
}

export { LineChart }
