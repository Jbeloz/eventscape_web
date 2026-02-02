import React, { forwardRef, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";

interface Door {
  id: number;
  type: string;
  width: string;
  height: string;
  offsetFromCorner: string;
  swingDirection: string;
  hingePosition: string;
  wall: string; // "Top", "Bottom", "Left", "Right"
}

interface VenueFloorPlanVisualizerProps {
  length: string;
  width: string;
  doors: Door[];
  theme: any;
}

export interface VenueFloorPlanVisualizerRef {
  getCanvasImage: () => Promise<Blob | null>;
}

const VenueFloorPlanVisualizer = forwardRef<
  VenueFloorPlanVisualizerRef,
  VenueFloorPlanVisualizerProps
>(({ length, width, doors, theme }, ref) => {
  const viewShotRef = useRef<any>(null);

  // Parse dimensions
  const lengthNum = parseFloat(length) || 0;
  const widthNum = parseFloat(width) || 0;

  // SVG drawing constants
  const maxCanvasSize = 400;
  const padding = 40;
  const doorWidth = 8;
  const doorColor = "#FF6B6B";

  // Calculate aspect ratio and scale
  const aspectRatio = widthNum / lengthNum;
  let venueWidth: number;
  let venueHeight: number;

  if (aspectRatio > 1) {
    venueWidth = maxCanvasSize;
    venueHeight = maxCanvasSize / aspectRatio;
  } else {
    venueHeight = maxCanvasSize;
    venueWidth = maxCanvasSize * aspectRatio;
  }

  // Center the venue in the canvas
  const startX = padding + (maxCanvasSize - venueWidth) / 2;
  const startY = padding + (maxCanvasSize - venueHeight) / 2;

  // Process doors for rendering
  const doorElements = (lengthNum > 0 && widthNum > 0) ? doors
    .filter(
      (door) =>
        door.width &&
        door.offsetFromCorner &&
        door.wall
    )
    .map((door) => {
      const offsetNum = parseFloat(door.offsetFromCorner) || 0;
      const doorWidthNum = parseFloat(door.width) || 0;

      // Ensure we have valid numbers before calculating scale factor
      if (!isFinite(offsetNum) || !isFinite(doorWidthNum) || widthNum === 0) {
        return null;
      }

      // Scale offset and door width to canvas coordinates
      const scaleFactor = venueWidth / widthNum;
      const scaledOffset = offsetNum * scaleFactor;
      const scaledDoorWidth = doorWidthNum * scaleFactor;

      // Ensure all values are valid numbers
      if (!isFinite(scaledOffset) || !isFinite(scaledDoorWidth) || scaledDoorWidth <= 0) {
        return null;
      }

      let doorX = 0;
      let doorY = 0;
      let doorW = 0;
      let doorH = 0;

      // Position doors on walls based on wall property
      if (door.wall === "Left") {
        doorX = Math.max(startX - 4, 0);
        doorY = Math.max(startY + scaledOffset, startY);
        doorW = 8;
        doorH = Math.max(scaledDoorWidth, 2);
      } else if (door.wall === "Right") {
        doorX = Math.max(startX + venueWidth - 4, startX + venueWidth - 8);
        doorY = Math.max(startY + scaledOffset, startY);
        doorW = 8;
        doorH = Math.max(scaledDoorWidth, 2);
      } else if (door.wall === "Top") {
        doorX = Math.max(startX + scaledOffset, startX);
        doorY = Math.max(startY - 4, 0);
        doorW = Math.max(scaledDoorWidth, 2);
        doorH = 8;
      } else if (door.wall === "Bottom") {
        doorX = Math.max(startX + scaledOffset, startX);
        doorY = Math.max(startY + venueHeight - 4, startY + venueHeight - 8);
        doorW = Math.max(scaledDoorWidth, 2);
        doorH = 8;
      }

      // Final safety check - ensure all coordinates are valid
      if (!isFinite(doorX) || !isFinite(doorY) || !isFinite(doorW) || !isFinite(doorH) || doorW <= 0 || doorH <= 0) {
        return null;
      }

      return (
        <Rect
          key={door.id}
          x={doorX}
          y={doorY}
          width={doorW}
          height={doorH}
          fill={doorColor}
          stroke="#c92a2a"
          strokeWidth={1}
        />
      );
    })
    .filter(el => el !== null) : [];

  // Expose canvas image capture method
  React.useImperativeHandle(ref, () => ({
    getCanvasImage: async () => {
      try {
        console.log("📸 Preparing floor plan snapshot...");
        
        // For now, return a placeholder since we're using SVG
        // In a real implementation, you would use react-native-view-shot or similar
        // For this version, the floor plan will save with 'pending-upload' placeholder
        console.warn("⚠️ Floor plan image capture not fully implemented yet");
        return null;
      } catch (error) {
        console.error("❌ Error capturing floor plan:", error);
        return null;
      }
    },
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.text }]}>Floor Plan Visualization</Text>
      
      <View ref={viewShotRef} style={styles.svgContainer}>
        {lengthNum <= 0 || widthNum <= 0 ? (
          <View style={styles.placeholderContainer}>
            <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
              Enter length and width to visualize floor plan
            </Text>
          </View>
        ) : (
          <Svg width={500} height={500} viewBox={`0 0 500 500`}>
            {/* Grid background */}
            {Array.from({ length: 26 }).map((_, i) => (
              <React.Fragment key={`grid-v-${i}`}>
                <Line
                  x1={padding + i * 20}
                  y1={padding}
                  x2={padding + i * 20}
                  y2={500 - padding}
                  stroke="#e0e0e0"
                  strokeWidth={0.5}
                />
              </React.Fragment>
            ))}
            {Array.from({ length: 26 }).map((_, i) => (
              <React.Fragment key={`grid-h-${i}`}>
                <Line
                  x1={padding}
                  y1={padding + i * 20}
                  x2={500 - padding}
                  y2={padding + i * 20}
                  stroke="#e0e0e0"
                  strokeWidth={0.5}
                />
              </React.Fragment>
            ))}

            {/* Venue rectangle */}
            <Rect
              x={startX}
              y={startY}
              width={Math.max(venueWidth, 1)}
              height={Math.max(venueHeight, 1)}
              fill="white"
              stroke="black"
              strokeWidth={3}
            />

            {/* Doors */}
            {doorElements}

            {/* Dimensions label */}
            <SvgText
              x={startX + venueWidth / 2}
              y={485}
              textAnchor="middle"
              fontSize={12}
              fill={theme.text}
            >
              {`${lengthNum}m × ${widthNum}m`}
            </SvgText>
          </Svg>
        )}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: "white", borderColor: "black", borderWidth: 2 }]} />
          <Text style={[styles.legendText, { color: theme.text }]}>Venue</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: doorColor }]} />
          <Text style={[styles.legendText, { color: theme.text }]}>Door</Text>
        </View>
      </View>
    </View>
  );
});

const doorColor = "#FF6B6B";

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    alignItems: "center",
  },
  svgContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginVertical: 12,
    minHeight: 300,
  },
  placeholderContainer: {
    width: "100%",
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  placeholderText: {
    fontSize: 14,
    textAlign: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  legend: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
});

export default VenueFloorPlanVisualizer;
