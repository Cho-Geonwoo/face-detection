import {Text, View} from 'react-native';
import {useEffect, useRef, useState} from 'react';
import {
  Camera,
  useCameraDevice,
  useFrameProcessor,
} from 'react-native-vision-camera';
import {
  useFaceDetector,
  FaceDetectionOptions,
} from 'react-native-vision-camera-face-detector';
import {Worklets} from 'react-native-worklets-core';

export default function App() {
  const [isFaceDetected, setIsFaceDetected] = useState(false);

  const faceDetectionOptions = useRef<FaceDetectionOptions>({
    performanceMode: 'fast',
    contourMode: 'all',
  }).current;

  const device = useCameraDevice('front');
  const {detectFaces} = useFaceDetector(faceDetectionOptions);

  useEffect(() => {
    (async () => {
      await Camera.requestCameraPermission();
    })();
  }, [device]);

  const handleDetectedFaces = Worklets.createRunOnJS(() => {
    setIsFaceDetected(true);
  });

  const handleUndetectedFaces = Worklets.createRunOnJS(() => {
    setIsFaceDetected(false);
  });

  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';
      const faces = detectFaces(frame);
      if (faces.length > 0) {
        console.log(faces);
        handleDetectedFaces();
      } else {
        handleUndetectedFaces();
      }
    },
    [handleDetectedFaces],
  );

  return (
    <View style={{flex: 1}}>
      {device ? (
        <Camera
          device={device}
          isActive={true}
          style={{flex: 1}}
          frameProcessor={frameProcessor}
        />
      ) : (
        <Text>No Device</Text>
      )}
      <Text>{isFaceDetected ? 'Face Detected' : 'No Face Detected'}</Text>
    </View>
  );
}
