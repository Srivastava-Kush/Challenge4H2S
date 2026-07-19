import Stadium from '../models/Stadium.js';
import { getMapData } from '../services/stadiumDataService.js';

export const getStadium = async (req, res) => {
  try {
    const stadium = await Stadium.findOne().lean();
    if (!stadium) return res.status(404).json({ error: 'Stadium data not found' });
    res.json(stadium);
  } catch (err) {
    console.error('getStadium error:', err);
    res.status(500).json({ error: 'Failed to load stadium data' });
  }
};

export const getNodes = async (req, res) => {
  try {
    const { nodes } = await getMapData();
    res.json(nodes);
  } catch (err) {
    console.error('getNodes error:', err);
    res.status(500).json({ error: 'Failed to load nodes' });
  }
};

export const getEdges = async (req, res) => {
  try {
    const { edges } = await getMapData();
    res.json(edges);
  } catch (err) {
    console.error('getEdges error:', err);
    res.status(500).json({ error: 'Failed to load edges' });
  }
};

export const getCrowd = async (req, res) => {
  try {
    const { crowd } = await getMapData();
    res.json(crowd);
  } catch (err) {
    console.error('getCrowd error:', err);
    res.status(500).json({ error: 'Failed to load crowd data' });
  }
};

export const getMap = async (req, res) => {
  try {
    const mapData = await getMapData();
    res.json(mapData);
  } catch (err) {
    console.error('getMap error:', err);
    res.status(500).json({ error: 'Failed to load stadium map data' });
  }
};

export const getFacilities = async (req, res) => {
  try {
    const stadium = await Stadium.findOne().lean();
    res.json(stadium?.facilities || []);
  } catch (err) {
    console.error('getFacilities error:', err);
    res.status(500).json({ error: 'Failed to load facilities' });
  }
};
