/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

describe('Mp4TtmlParser', function() {
  /** @const */
  var ttmlInitSegmentUri = '/base/test/test/assets/ttml-init.mp4';
  /** @const */
  var ttmlSegmentUri = '/base/test/test/assets/ttml-segment.mp4';
  /** @const */
  var ttmlSegmentMultipleMDATUri =
      '/base/test/test/assets/ttml-segment-multiplemdat.mp4';
  /** @const */
  var audioInitSegmentUri = '/base/test/test/assets/sintel-audio-init.mp4';

  /** @type {!ArrayBuffer} */
  var ttmlInitSegment;
  /** @type {!Uint8Array} */
  var ttmlSegment;
  /** @type {!Uint8Array} */
  var ttmlSegmentMultipleMDAT;
  /** @type {!ArrayBuffer} */
  var audioInitSegment;

  beforeAll(function(done) {
    Promise.all([
      shaka.test.Util.fetch(ttmlInitSegmentUri),
      shaka.test.Util.fetch(ttmlSegmentUri),
      shaka.test.Util.fetch(ttmlSegmentMultipleMDATUri),
      shaka.test.Util.fetch(audioInitSegmentUri)
    ]).then(function(responses) {
      ttmlInitSegment = responses[0];
      ttmlSegment = new Uint8Array(responses[1]);
      ttmlSegmentMultipleMDAT = new Uint8Array(responses[2]);
      audioInitSegment = responses[3];
    }).catch(fail).then(done);
  });

  it('parses init segment', function() {
    new shaka.text.Mp4TtmlParser().parseInit(ttmlInitSegment);
  });

  it('parses media segment', function() {
    var parser = new shaka.text.Mp4TtmlParser();
    parser.parseInit(ttmlInitSegment);
    var time = {periodStart: 0, segmentStart: 0, segmentEnd: 0 };
    var ret = parser.parseMedia(ttmlSegment, time);
    expect(ret.length).toBe(10);
  });

  it('handles media segments with multiple mdats', function() {
    var parser = new shaka.text.Mp4TtmlParser();
    parser.parseInit(ttmlInitSegment);
    var time = {periodStart: 0, segmentStart: 0, segmentEnd: 0 };
    var ret = parser.parseMedia(ttmlSegmentMultipleMDAT, time);
    expect(ret.length).toBe(20);
  });

  it('accounts for offset', function() {
    var time1 = {periodStart: 0, segmentStart: 0, segmentEnd: 0 };
    var time2 = {periodStart: 7, segmentStart: 0, segmentEnd: 0 };

    var parser = new shaka.text.Mp4TtmlParser();
    parser.parseInit(ttmlInitSegment);

    var ret1 = parser.parseMedia(ttmlSegment, time1);
    expect(ret1.length).toBeGreaterThan(0);

    var ret2 = parser.parseMedia(ttmlSegment, time2);
    expect(ret2.length).toBeGreaterThan(0);

    expect(ret2[0].startTime).toEqual(ret1[0].startTime + 7);
    expect(ret2[0].endTime).toEqual(ret1[0].endTime + 7);
  });

  it('rejects init segment with no ttml', function() {
    var error = new shaka.util.Error(
        shaka.util.Error.Severity.CRITICAL,
        shaka.util.Error.Category.TEXT,
        shaka.util.Error.Code.INVALID_MP4_TTML);

    try {
      new shaka.text.Mp4TtmlParser().parseInit(audioInitSegment);
      fail('Mp4 file with no ttml supported');
    } catch (e) {
      shaka.test.Util.expectToEqualError(e, error);
    }
  });
});
