'use strict';

const geolib = require('geolib');
const geocoder = require('geocoder');
const _ = require('lodash');

const reversGeoCodeCache = {};

function getDistance(a, b) {
  return geolib.getDistance(a, b);
}

function convertGeoDataToFormatedString(data) {
  const streets = _.filter(data, (e) => e.types.indexOf('street_address') !== -1);
  if (streets.length === 0) return null;
  const parts = _.filter(streets[0].address_components,
    (e) => (e.types.indexOf('street_number') !== -1) || (e.types.indexOf('route') !== -1));
  const stringSegments = _.map(parts, (e) => e.short_name || e.long_name);
  return stringSegments.join(' ');
}

function reverseGeoCode(location, callback) {
  const hash = `${location.latitude},${location.longitude}`;
  if (!reversGeoCodeCache[hash]) {
    geocoder.reverseGeocode(location.latitude, location.longitude, (err, data) => {
      if (data && data.results) {
        const formattedResults = convertGeoDataToFormatedString(data.results);
        reversGeoCodeCache[hash] = formattedResults;
        if (formattedResults) {
          callback(` (${formattedResults})`);
        } else {
          callback('');
        }
      } else {
        reversGeoCodeCache[hash] = '';
        callback('');
      }
    });
  } else {
    callback(reversGeoCodeCache[hash]);
  }
}

function radians(deg) {
  return (deg * Math.PI) / 180;
}

function degrees(rad) {
  return (rad * 180) / Math.PI;
}

function toRadians(a) {
  return {
    latitude: radians(a.latitude),
    longitiude: radians(a.longitude),
  };
}


function getBearing(start, target) {
  const s = toRadians(start);
  const d = toRadians(target);
  let dLong = d.longitiude - s.longitiude;
  const inner =
    Math.tan((d.latitude / 2.0) + (Math.PI / 4.0)) /
    Math.tan((s.latitude / 2.0) + (Math.PI / 4.0));
  const dPhi = Math.log(inner);
  if (Math.abs(dLong) > Math.PI) {
    if (dLong > 0.0) {
      dLong = -((2 * Math.PI) - dLong);
    } else {
      dLong = ((2 * Math.PI) + dLong);
    }
  }
  const bearing = degrees(Math.atan2(dLong, dPhi));
  return bearing;
}

const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
function cardinalBearing(deg) {
  const degreesPerItem = 360 / cardinals.length;
  const option = (deg + (degreesPerItem * 0.5)) / degreesPerItem;
  const index = Math.floor(option + cardinals.length) % cardinals.length;
  return cardinals[index];
}

module.exports = {
  getDistance,
  reverseGeoCode,
  getBearing,
  cardinalBearing,
};
