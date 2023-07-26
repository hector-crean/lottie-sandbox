



interface Dataset2D<Datum extends object> {
    title: string;
    subtitle: string;
    styling: { stroke: string, fill: string}
    series: Array<Datum>
    projection: (d: Datum) => { x: number, y: number};
}



interface Chart2D<Datum extends object> {
    title: string,
    subtitle: string
    datasets: Array<Dataset2D<Datum>>
}



export type { Chart2D, Dataset2D}