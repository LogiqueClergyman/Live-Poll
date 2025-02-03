"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
const ApexCharts = dynamic(() => import("react-apexcharts"), { ssr: false });
interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  votes_count: number | null;
}
function Chart() {
  // console.log(series, labels, totalVotes);

  const [series, setSeries] = React.useState<number[]>([]);
  const [labels, setLabels] = React.useState<string[]>([]);
  const [totalVotes, setTotalVotes] = React.useState<number>(0);
  useEffect(() => {
    const pathSegments = window.location.pathname.split("/");
    const urlId = pathSegments[pathSegments.length - 1];

    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/polls/` + urlId
        );
        if (response.data && response.data.options) {
          extractPercentageArray(response.data.options);
        } else {
          console.error("Invalid response data");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (urlId) {
      fetchData();
    }
  }, []);
  const extractPercentageArray = (options: PollOption[]) => {
    const percentageArray: number[] = [];
    const labelsArray: string[] = [];
    let totalVotes = 0;
    options.forEach((option) => {
      totalVotes += option.votes_count ?? 0;
    });
    if (totalVotes === 0) {
      console.error("Total votes are zero, cannot calculate percentages");
      return;
    }
    options.forEach((option) => {
      const percentage = (option.votes_count ?? 0) / totalVotes;
      percentageArray.push(percentage * 100);
      labelsArray.push(option.option_text);
    });
    setSeries(percentageArray);
    setLabels(labelsArray);
    setTotalVotes(totalVotes);
  };
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
                color: "#fff",
                offsetY: 20,
              },
              total: {
                showAlways: true,
                show: true,
                label: "Total Votes",
                fontFamily: "Inter, sans-serif",
                color: "#fff",
                formatter: function () {
                  return totalVotes + " votes";
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
          colors: "#fff",
        },
      },
    };
  };
  if (series.length === 0 || labels.length === 0) {
    return <div>No Votes yet</div>;
  }
  return (
    <div>
      <h2>Percentage share</h2>
      {series.length > 0 ? (
        <div>
          {/* @ts-expect-error - ApexCharts component has incomplete TypeScript definitions */}
          <ApexCharts type="donut" series={series} height={400} options={getChartOptions()}
            />
        </div>
      ) : (
        <div>No Votes yet</div>
      )}
    </div>
  );
}

export default Chart;
