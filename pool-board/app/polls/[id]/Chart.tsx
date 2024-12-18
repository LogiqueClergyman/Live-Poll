'use client';

import React from 'react'
import dynamic from "next/dynamic";
const ApexCharts = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ChartProps {
  series: number[];
  labels: string[];
}

function Chart({ series, labels }: ChartProps) {
    const getChartOptions = () => {
        return {
          series: series, // Using the percentages from the chart data
          colors: ["#1C64F2", "#16BDCA", "#FDBA8C", "#E74694"], // Adjust as needed
          chart: {
            height: 320,
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
                    offsetY: 20,
                  },
                  total: {
                    showAlways: true,
                    show: true,
                    label: "Total Votes",
                    fontFamily: "Inter, sans-serif",
                    formatter: function (w: any) {
                      const sum = w.globals.seriesTotals.reduce(
                        (a: number, b: number) => a + b,
                        0
                      );
                      return sum + " votes"; // Show total number of votes
                    },
                  },
                  value: {
                    show: true,
                    fontFamily: "Inter, sans-serif",
                    offsetY: -20,
                    formatter: function (value: number) {
                      return value + "%"; // Show percentage
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
          labels: labels, // Using the option texts as labels
          dataLabels: {
            enabled: false,
          },
          legend: {
            position: "bottom",
            fontFamily: "Inter, sans-serif",
          },
        };
      };
  return (
    <div>
        <ApexCharts
          type="donut"
          series={series}
          height={320}
          options={getChartOptions()}
        />
    </div>
  )
}

export default Chart