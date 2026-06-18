const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Load models
const User = require('../modules/user/user.model');
const Site = require('../modules/site/site.model');
const Material = require('../modules/material/material.model');
const Request = require('../modules/request/request.model');
const Inventory = require('../modules/inventory/inventory.model');
const InventoryEntry = require('../modules/inventory/inventoryEntry.model');
const Notification = require('../modules/notification/notification.model');

const run = async () => {
  try {
    await connectDB();
    console.log('Database connected successfully for migration.');

    // Fetch the first owner in the database to use as default owner fallback
    const firstOwner = await User.findOne({ role: 'owner' }).sort({ createdAt: 1 });
    if (!firstOwner) {
      console.error('No owner user found in the database. Run server first to seed default owners.');
      process.exit(1);
    }
    const defaultOwnerId = firstOwner._id;
    console.log(`Default owner resolved: ${firstOwner.email} (${defaultOwnerId})`);

    // Helper map/cache to find parent owner of staff/managers
    const userCache = {};
    const getUserParentOwner = async (userId) => {
      if (!userId) return defaultOwnerId;
      const key = userId.toString();
      if (userCache[key]) return userCache[key];

      const u = await User.findById(userId);
      if (!u) {
        userCache[key] = defaultOwnerId;
        return defaultOwnerId;
      }
      if (u.role === 'owner') {
        userCache[key] = u._id;
        return u._id;
      }
      // managers and staff parentUserId is owner
      if (u.parentUserId) {
        const parentOwner = await getUserParentOwner(u.parentUserId);
        userCache[key] = parentOwner;
        return parentOwner;
      }
      userCache[key] = defaultOwnerId;
      return defaultOwnerId;
    };

    // 1. Backfill User (managers and staff) -> set ownerId = parentUserId
    console.log('Backfilling User records...');
    const users = await User.find({ role: { $in: ['manager', 'staff'] } });
    let updatedUsers = 0;
    for (const u of users) {
      if (!u.ownerId) {
        u.ownerId = u.parentUserId || defaultOwnerId;
        await u.save();
        updatedUsers++;
      }
    }
    console.log(`Users backfilled: ${updatedUsers}`);

    // 2. Backfill Site -> set ownerId = managerId.parentUserId (if manager exists) else default
    console.log('Backfilling Site records...');
    const sites = await Site.find({});
    let updatedSites = 0;
    for (const s of sites) {
      if (!s.ownerId) {
        let siteOwnerId = defaultOwnerId;
        if (s.managerId) {
          siteOwnerId = await getUserParentOwner(s.managerId);
        }
        s.ownerId = siteOwnerId;
        await s.save();
        updatedSites++;
      }
    }
    console.log(`Sites backfilled: ${updatedSites}`);

    // 3. Backfill Material -> set ownerId = first owner (or createdBy if available; else default owner)
    console.log('Backfilling Material records...');
    const materials = await Material.find({});
    let updatedMaterials = 0;
    for (const m of materials) {
      if (!m.ownerId) {
        m.ownerId = defaultOwnerId;
        await m.save();
        updatedMaterials++;
      }
    }
    console.log(`Materials backfilled: ${updatedMaterials}`);

    // 4. Backfill Request -> set ownerId = createdBy.parentUserId
    console.log('Backfilling Request records...');
    const requests = await Request.find({});
    let updatedRequests = 0;
    for (const r of requests) {
      if (!r.ownerId) {
        const oId = await getUserParentOwner(r.createdBy);
        r.ownerId = oId;
        await r.save();
        updatedRequests++;
      }
    }
    console.log(`Requests backfilled: ${updatedRequests}`);

    // 5. Backfill InventoryEntry -> set ownerId = createdBy.parentUserId
    console.log('Backfilling InventoryEntry records...');
    const entries = await InventoryEntry.find({});
    let updatedEntries = 0;
    for (const e of entries) {
      if (!e.ownerId) {
        const oId = await getUserParentOwner(e.createdBy);
        e.ownerId = oId;
        await e.save();
        updatedEntries++;
      }
    }
    console.log(`InventoryEntries backfilled: ${updatedEntries}`);

    // 6. Backfill Inventory -> set ownerId = site.ownerId
    console.log('Backfilling Inventory records...');
    const inventories = await Inventory.find({});
    let updatedInventories = 0;
    for (const i of inventories) {
      if (!i.ownerId) {
        const site = await Site.findById(i.siteId);
        i.ownerId = site ? site.ownerId : defaultOwnerId;
        await i.save();
        updatedInventories++;
      }
    }
    console.log(`Inventories backfilled: ${updatedInventories}`);

    // 7. Backfill Notification -> set ownerId = userId.parentUserId
    console.log('Backfilling Notification records...');
    const notifications = await Notification.find({});
    let updatedNotifications = 0;
    for (const n of notifications) {
      if (!n.ownerId) {
        const oId = await getUserParentOwner(n.userId);
        n.ownerId = oId;
        await n.save();
        updatedNotifications++;
      }
    }
    console.log(`Notifications backfilled: ${updatedNotifications}`);

    console.log('Database backfill migration finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

run();
