import {Text, View} from 'react-native';
import {useEffect, useRef, useState} from 'react';
import {
  Camera,
  useCameraDevice,
  useFrameProcessor,
  VideoFile,
} from 'react-native-vision-camera';
import {
  useFaceDetector,
  FaceDetectionOptions,
} from 'react-native-vision-camera-face-detector';
import {Worklets} from 'react-native-worklets-core';

export default function App() {
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);

  const faceDetectionOptions = useRef<FaceDetectionOptions>({
    performanceMode: 'fast',
    contourMode: 'all',
  }).current;

  const device = useCameraDevice('front');
  const {detectFaces} = useFaceDetector(faceDetectionOptions);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    (async () => {
      await Camera.requestCameraPermission();
    })();
  }, [device]);

  const handleDetectedFaces = Worklets.createRunOnJS(async () => {
    setIsFaceDetected(true);
    if (!isRecording && cameraRef.current) {
      setIsRecording(true);
      await cameraRef.current.startRecording({
        onRecordingFinished: videoFile => {
          setVideoFile(videoFile);
          setIsRecording(false);
        },
        onRecordingError: error => {
          console.error(error);
          setIsRecording(false);
        },
      });
    }
  });

  const handleUndetectedFaces = Worklets.createRunOnJS(async () => {
    setIsFaceDetected(false);
    if (isRecording && cameraRef.current) {
      await cameraRef.current.stopRecording();
    }
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
    [handleDetectedFaces, handleUndetectedFaces],
  );

  return (
    <View style={{flex: 1}}>
      {device ? (
        <Camera
          ref={cameraRef}
          device={device}
          isActive={true}
          style={{flex: 1}}
          frameProcessor={frameProcessor}
        />
      ) : (
        <Text>No Device</Text>
      )}
      <Text>{isFaceDetected ? 'Face Detected' : 'No Face Detected'}</Text>
      {videoFile && (
        <View>
          <Text>Video recorded at: {videoFile.path}</Text>
        </View>
      )}
    </View>
  );
}
