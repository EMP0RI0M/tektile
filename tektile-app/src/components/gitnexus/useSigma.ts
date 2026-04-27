import { useRef, useEffect, useCallback, useState } from 'react';
import Sigma from 'sigma';
import Graph from 'graphology';
import FA2Layout from 'graphology-layout-forceatlas2/worker';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import EdgeCurveProgram from '@sigma/edge-curve';
import { GraphNodeAttributes, GraphEdgeAttributes } from '@/lib/gitnexus/graph-builder';

interface UseSigmaOptions {
  onNodeClick?: (nodeId: string) => void;
}

export const useSigma = (options: UseSigmaOptions = {}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph<GraphNodeAttributes, GraphEdgeAttributes> | null>(null);
  const layoutRef = useRef<FA2Layout | null>(null);
  const layoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [isLayoutRunning, setIsLayoutRunning] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // Ensure container has dimensions before initializing
    const initSigma = () => {
      if (sigmaRef.current || !container.clientWidth || !container.clientHeight) return;

      const graph = new Graph<GraphNodeAttributes, GraphEdgeAttributes>();
      graphRef.current = graph;

      const sigma = new Sigma(graph, container, {
        renderLabels: true,
        labelFont: 'JetBrains Mono, monospace',
        labelSize: 11,
        labelWeight: '500',
        labelColor: { color: '#e4e4ed' },
        defaultNodeColor: '#6b7280',
        defaultEdgeColor: '#2a2a3a',
        defaultEdgeType: 'curved',
        edgeProgramClasses: {
          curved: EdgeCurveProgram as any,
        },
      });

      sigmaRef.current = sigma;

      sigma.on('clickNode', ({ node }) => {
        options.onNodeClick?.(node);
      });
    };

    // Use ResizeObserver to wait for container to have dimensions
    const observer = new ResizeObserver(() => {
      if (!sigmaRef.current) {
        initSigma();
      } else {
        sigmaRef.current.refresh();
      }
    });

    observer.observe(container);

    // Initial check
    initSigma();

    return () => {
      observer.disconnect();
      if (layoutRef.current) {
        try { layoutRef.current.kill(); } catch (e) {}
      }
      if (layoutTimeoutRef.current) clearTimeout(layoutTimeoutRef.current);
      if (sigmaRef.current) {
        try { sigmaRef.current.kill(); } catch (e) {}
      }
      sigmaRef.current = null;
      graphRef.current = null;
    };
  }, [options.onNodeClick]);

  const runLayout = useCallback((graph: Graph<GraphNodeAttributes, GraphEdgeAttributes>) => {
    if (graph.order === 0) return;

    if (layoutRef.current) {
      layoutRef.current.kill();
    }
    if (layoutTimeoutRef.current) {
      clearTimeout(layoutTimeoutRef.current);
    }

    const inferredSettings = forceAtlas2.inferSettings(graph);
    const layout = new FA2Layout(graph, { settings: { ...inferredSettings, slowDown: 2, scalingRatio: 20 } });

    layoutRef.current = layout;
    layout.start();
    setIsLayoutRunning(true);

    layoutTimeoutRef.current = setTimeout(() => {
      if (layoutRef.current) {
        layoutRef.current.stop();
        layoutRef.current = null;
        sigmaRef.current?.refresh();
        setIsLayoutRunning(false);
      }
    }, 5000);
  }, []);

  const setGraph = useCallback((newGraph: Graph<GraphNodeAttributes, GraphEdgeAttributes>) => {
    const sigma = sigmaRef.current;
    if (!sigma) return;

    if (layoutRef.current) {
      layoutRef.current.kill();
    }
    if (layoutTimeoutRef.current) {
      clearTimeout(layoutTimeoutRef.current);
    }

    graphRef.current = newGraph;
    sigma.setGraph(newGraph as any);
    
    runLayout(newGraph);
    sigma.getCamera().animatedReset({ duration: 500 });
  }, [runLayout]);

  const zoomIn = useCallback(() => {
    sigmaRef.current?.getCamera().animatedZoom({ duration: 200 });
  }, []);

  const zoomOut = useCallback(() => {
    sigmaRef.current?.getCamera().animatedUnzoom({ duration: 200 });
  }, []);

  const resetZoom = useCallback(() => {
    sigmaRef.current?.getCamera().animatedReset({ duration: 300 });
  }, []);

  return {
    containerRef,
    setGraph,
    zoomIn,
    zoomOut,
    resetZoom,
    isLayoutRunning,
  };
};
