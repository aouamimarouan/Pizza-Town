import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { logAdminAction } from '../lib/auditLogger.js';

const router = Router();

const DEFAULT_SETTINGS = {
  id: 'default',
  delivery_fee_enabled: true,
  delivery_fee_amount: 3.50,
  free_delivery_threshold: 0.00,
  is_store_open: true,
  store_closed_message: 'Het restaurant is momenteel gesloten voor bestellingen.',
  announcement_banner: '',
  min_order_amount: 0.00
};

const formatSettings = (s) => ({
  id: s.id,
  delivery_fee_enabled: Boolean(s.delivery_fee_enabled),
  delivery_fee_amount: s.delivery_fee_amount !== null && s.delivery_fee_amount !== undefined ? parseFloat(s.delivery_fee_amount.toString()) : 3.50,
  free_delivery_threshold: s.free_delivery_threshold !== null && s.free_delivery_threshold !== undefined ? parseFloat(s.free_delivery_threshold.toString()) : 0.00,
  is_store_open: s.is_store_open !== false,
  store_closed_message: s.store_closed_message || '',
  announcement_banner: s.announcement_banner || '',
  min_order_amount: s.min_order_amount !== null && s.min_order_amount !== undefined ? parseFloat(s.min_order_amount.toString()) : 0.00,
  updated_at: s.updated_at
});

export const getStoreSettings = async () => {
  try {
    let settings = await prisma.store_settings.findUnique({
      where: { id: 'default' }
    });

    if (!settings) {
      settings = await prisma.store_settings.create({
        data: DEFAULT_SETTINGS
      });
    }

    return formatSettings(settings);
  } catch (err) {
    console.warn('[StoreSettings] Error reading settings from DB, falling back to defaults:', err.message);
    return DEFAULT_SETTINGS;
  }
};

// GET /api/settings — Public: Read store parameters
router.get('/', async (req, res) => {
  try {
    const settings = await getStoreSettings();
    res.json(settings);
  } catch (err) {
    console.error('[Settings GET error]:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// PUT /api/settings — Admin only: Update store parameters
router.put('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      delivery_fee_enabled,
      delivery_fee_amount,
      free_delivery_threshold,
      is_store_open,
      store_closed_message,
      announcement_banner,
      min_order_amount
    } = req.body;

    const dataToUpdate = {};

    if (delivery_fee_enabled !== undefined) {
      dataToUpdate.delivery_fee_enabled = Boolean(delivery_fee_enabled);
    }

    if (delivery_fee_amount !== undefined) {
      const parsed = parseFloat(delivery_fee_amount);
      if (isNaN(parsed) || parsed < 0) {
        return res.status(400).json({ error: 'Bezorgkosten moeten een geldig positief getal zijn.' });
      }
      dataToUpdate.delivery_fee_amount = parsed;
    }

    if (free_delivery_threshold !== undefined) {
      const parsed = parseFloat(free_delivery_threshold);
      if (isNaN(parsed) || parsed < 0) {
        return res.status(400).json({ error: 'Drempelwaarde voor gratis bezorging moet positief zijn.' });
      }
      dataToUpdate.free_delivery_threshold = parsed;
    }

    if (is_store_open !== undefined) {
      dataToUpdate.is_store_open = Boolean(is_store_open);
    }

    if (store_closed_message !== undefined) {
      dataToUpdate.store_closed_message = typeof store_closed_message === 'string' ? store_closed_message.trim() : '';
    }

    if (announcement_banner !== undefined) {
      dataToUpdate.announcement_banner = typeof announcement_banner === 'string' ? announcement_banner.trim() : '';
    }

    if (min_order_amount !== undefined) {
      const parsed = parseFloat(min_order_amount);
      if (isNaN(parsed) || parsed < 0) {
        return res.status(400).json({ error: 'Minimum bestelbedrag moet een geldig positief getal zijn.' });
      }
      dataToUpdate.min_order_amount = parsed;
    }

    const updated = await prisma.store_settings.upsert({
      where: { id: 'default' },
      update: dataToUpdate,
      create: {
        ...DEFAULT_SETTINGS,
        ...dataToUpdate
      }
    });

    const formatted = formatSettings(updated);

    // Audit logging
    await logAdminAction(req.user.user_id, 'UPDATE', 'StoreSettings', 'default', {
      updatedFields: dataToUpdate,
      finalState: formatted
    });

    // Broadcast update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('settings_updated', formatted);
    }

    res.json(formatted);
  } catch (err) {
    console.error('[Settings PUT error]:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

export default router;
