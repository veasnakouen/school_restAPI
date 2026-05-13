import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, Box } from "@mui/material";
import {
  Chart as ChartJS,
  ChartEvent,
  ActiveElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from "chart.js";
import { Pie } from "react-chartjs-2";

// Register required Chart.js components
ChartJS.register(ArcElement, Title, Tooltip, Legend);

// ============================================================================
// External Tooltip Handler (Chart.js v3/v4 compatible)
// ============================================================================
const getOrCreateTooltip = (chart: ChartJS): HTMLDivElement | null => {
  const chartContainer = chart.canvas.parentNode as HTMLElement | null;
  if (!chartContainer) {
    return null;
  }

  let tooltipEl = chartContainer.querySelector<HTMLDivElement>("#chartjs-tooltip");

  if (!tooltipEl) {
    tooltipEl = document.createElement("div");
    tooltipEl.id = "chartjs-tooltip"; // Unique identifier
    tooltipEl.style.background = "rgba(0, 0, 0, 0.85)";
    tooltipEl.style.borderRadius = "8px";
    tooltipEl.style.color = "white";
    tooltipEl.style.opacity = "0";
    tooltipEl.style.pointerEvents = "none";
    tooltipEl.style.position = "absolute";
    tooltipEl.style.transform = "translate(-50%, 0)";
    tooltipEl.style.transition = "all 0.1s ease";
    tooltipEl.style.padding = "8px 12px";
    tooltipEl.style.fontSize = "13px";
    tooltipEl.style.zIndex = "1000";

    const table = document.createElement("table");
    table.style.margin = "0";
    table.style.borderCollapse = "collapse";

    tooltipEl.appendChild(table);
    chartContainer.appendChild(tooltipEl);
  }

  return tooltipEl;
};

const updateTooltipContent = (tooltip: any, tooltipEl: HTMLElement) => {
  if (tooltip.body) {
    const titleLines: string[] = tooltip.title || [];
    const bodyLines = tooltip.body.map((b: any) => b.lines);

    const tableRoot = tooltipEl.querySelector("table");
    if (!tableRoot) return;

    // Clear existing content
    while (tableRoot.firstChild) {
      tableRoot.removeChild(tableRoot.firstChild);
    }

    // Add title
    if (titleLines.length > 0) {
      const thead = document.createElement("thead");
      titleLines.forEach((title: string) => {
        const tr = document.createElement("tr");
        const th = document.createElement("th");
        th.style.textAlign = "left";
        th.style.fontWeight = "600";
        th.style.paddingBottom = "4px";
        th.style.border = "0";
        th.textContent = title;
        tr.appendChild(th);
        thead.appendChild(tr);
      });
      tableRoot.appendChild(thead);
    }

    // Add body rows with color indicators
    const tbody = document.createElement("tbody");
    bodyLines.forEach((body:any, i:any) => {
      const colors = tooltip.labelColors[i];
      const span = document.createElement("span");
      span.style.display = "inline-block";
      span.style.width = "12px";
      span.style.height = "12px";
      span.style.borderRadius = "50%";
      span.style.backgroundColor = colors.backgroundColor as string;
      span.style.borderColor = colors.borderColor as string;
      span.style.borderWidth = "2px";
      span.style.marginRight = "8px";

      const td = document.createElement("td");
      td.style.padding = "2px 0";
      td.style.whiteSpace = "nowrap";
      td.style.border = "0";

      const text = document.createTextNode(body[0]);
      td.appendChild(span);
      td.appendChild(text);

      const tr = document.createElement("tr");
      tr.style.border = "0";
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
    tableRoot.appendChild(tbody);
  }
};

const updateTooltipPosition = (chart: ChartJS, tooltip: any, tooltipEl: HTMLElement) => {
  const { canvas } = chart;
  const rect = canvas.getBoundingClientRect();

  tooltipEl.style.opacity = "1";
  tooltipEl.style.left = `${rect.left + window.scrollX + tooltip.caretX}px`;
  tooltipEl.style.top = `${rect.top + window.scrollY + tooltip.caretY - 10}px`;
  tooltipEl.style.transform = "translate(-50%, -110%)"; // Position above cursor
};

const externalTooltipHandler = (context: any) => {
  const { chart, tooltip } = context;
  const tooltipEl = getOrCreateTooltip(chart);

  if (!tooltipEl) return;

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = "0";
    return;
  }

  updateTooltipContent(tooltip, tooltipEl);
  updateTooltipPosition(chart, tooltip, tooltipEl);
};

// ============================================================================
// Component Props & Definition
// ============================================================================
interface ActivityChartProps {
  stats: {
    products: number;
    users: number;
    roles: number;
  };
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ stats}) => {
  const navigate = useNavigate();
  // Navigation paths must match the order of labels in the chart data
  const navigationPaths = [
    "/products",
    "/admin/users",
    "/admin/roles",
  ] as const;

  const handleClick = (event: ChartEvent, activeElements: ActiveElement[]) => {
    if (activeElements.length > 0) {
      const sliceIndex = activeElements[0].index;
      const targetPath = navigationPaths[sliceIndex];
      if (targetPath) {
        navigate(targetPath);
      }
    }
  };

  const handleHover = (event: ChartEvent, activeElements: ActiveElement[]): void => {
    const canvas = event.native?.target as HTMLCanvasElement;
    if (canvas) {
      canvas.style.cursor = activeElements.length > 0 ? "pointer" : "default";
    }
  };

  const options: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleClick,
    onHover: handleHover,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      title: {
        display: true,
        text: "Data Distribution",
        font: {
          size: 16,
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        enabled: false, // Disable default tooltip to use external handler
        external: externalTooltipHandler,
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
    },
} as any;

  const data = {
    labels: ["Products", "Users", "Roles"],
    datasets: [
      {
        label: "Total Count",
        data: [stats.products, stats.users, stats.roles],
        backgroundColor: [
          "rgba(59, 130, 246, 0.85)", // Blue
          "rgba(249, 115, 22, 0.85)", // Orange
          "rgba(34, 197, 94, 0.85)", // Green
        ],
        borderColor: ["#ffffff", "#ffffff", "#ffffff"],
        borderWidth: 2,
        hoverOffset: 8,
        hoverBorderWidth: 3,
      },
    ],
  };

  return (
    <Card elevation={0} variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ height: 320, position: "relative", width: "100%" }}>
          <Pie data={data} options={options} />
        </Box>
      </CardContent>
    </Card>
  );
};
