"use client";

import React from "react";
import dynamic from "next/dynamic";
const ApexCharts = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ChartProps {
  series: number[];
  labels: string[];
}

function Chart({ series, labels }: ChartProps) {
  const getChartOptions = () => {
    return {
      colors: [
        "#16BDCA",
        "#FDBA8C",
        "#E74694",
        "#FFD700",
        "#DDA0DD",
        "#87CEEB",
        "#98FB98",
        "#FFA07A",
        "#FF69B4",
        "#1C64F2",
      ],
      chart: {
        height: 400,
        width: "100%",
        type: "donut",
      },
      stroke: {
        colors: ["transparent"],
        lineCap: "",
      },
      plotOptions: {
        pie: {
          donut: {
            labels: {
              show: true,
              name: {
                show: true,
                fontFamily: "Inter, sans-serif",
                fontSize: "22px",
                color: "#fff", // Changed from #fff to #000
                offsetY: 20,
              },
              total: {
                showAlways: true,
                show: true,
                label: "Total Votes",
                fontFamily: "Inter, sans-serif",
                color: "#fff", // Changed from #fff to #000
                formatter: function (w: any) {
                  const sum = w.globals.seriesTotals.reduce(
                    (a: number, b: number) => a + b,
                    0
                  );
                  return sum + "% votes";
                },
              },
              value: {
                show: true,
                fontFamily: "Inter, sans-serif",
                offsetY: -20,
                formatter: function (value: number) {
                  return value + "%";
                },
              },
            },
            size: "80%",
          },
        },
      },
      grid: {
        padding: {
          top: -2,
        },
      },
      labels: labels,
      dataLabels: {
        enabled: false,
      },
      legend: {
        position: "bottom",
        horizontalAlign: "start",
        fontFamily: "Inter, sans-serif",
        labels: {
          colors: "#fff", // Added legend label color
        },
      },
    };
  };
  return (
    <div>
      <ApexCharts
        type="donut"
        series={series}
        height={400}
        options={getChartOptions()}
      />
    </div>
  );
}

export default Chart;
