import * as React from 'react';
import {
  Button,
  Image,
  View,
  Text,
  ActivityIndicator,
  Alert,
  TextInput,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
  Clipboard,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { EvilIcons, Ionicons } from '@expo/vector-icons';

import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import * as MediaLibrary from 'expo-media-library';
import jiitLogo from '../assets/jiit.png';
import imagePlaceholder from '../assets/preview.png';
import wait from '../assets/wait.gif';
import * as ImageManipulator from 'expo-image-manipulator';

const WIDTH = Dimensions.get('window').width;
const HEIGHT = Dimensions.get('window').height;
const keyboardVerticalOffset = Platform.OS === 'ios' ? 40 : 40;

export default class Encrypter extends React.Component {
  state = {
    text: null,
    data: null,
    type: 'encoding',
    image: false,
    imageSelect: null,
    isUploading: false,
    mainImage: false,
    base64send: null,
    b64: null,
    loading: false,
    copied: false,
    nbs64: ''
  };
  componentDidMount() {
    this.getPermissionAsync();
  }

  getPermissionAsync = async () => {
    if (Constants.platform.ios) {
      const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
      }
    }
  };
  _pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 1
    });

    if (!result.cancelled) {
      let nbs64 = await FileSystem.readAsStringAsync(result.uri, {
        encoding: 'base64'
      });

      this.setState({ mainImage: true, image: result.uri, nbs64 });
    }
  };

  encode = async () => {
    console.log('--------Encoding!--------');
    this.setState({
      loading: true
    });
    let formData = new FormData();
    formData.append('text', this.state.text);
    // formData.append("image", this.state.file)

    try {
      let res = await axios.post('http://5cf99b89.ngrok.io/encode', formData);
      this.setState({
        b64: `data:image/png;base64,${res.data.image}`,
        wb64: res.data.image,
        key: res.data.key
      });

      // json.qr is base64 string "data:image/png;base64,..."

      await FileSystem.writeAsStringAsync(
        FileSystem.documentDirectory + 'temp.png',
        `${res.data.image}`,
        { encoding: 'base64' }
      );

      await MediaLibrary.requestPermissionsAsync();
      await MediaLibrary.createAssetAsync(
        FileSystem.documentDirectory + 'temp.png'
      );
      this.setState({
        loading: false
      });
    } catch (err) {
      this.setState({
        loading: false
      });
      alert('Error Encoding Image');
      console.log(err);
    }
  };

  decode = async () => {
    console.log('--------Decoding!--------');
    this.setState({
      loading: true
    });
    // let file = await FileSystem.readAsStringAsync(this.state.mainimage, { encoding: 'base64' });
    // console.log(file.substring(0,50))
    // this.setState({
    //     base64send: file
    // })
    let bb64 = this.state.nbs64.replace('data:image/png;base64,', '');
    console.log(bb64.substring(0, 100));
    let formData = new FormData();
    formData.append('key', this.state.text);
    formData.append('image', this.state.wb64);

    try {
      let res = await axios.post('http://5cf99b89.ngrok.io/decode', formData);
      console.log(res.data.text);

      this.setState({
        data: res.data.text,
        image: null,
        loading: false
      });
    } catch (err) {
      alert('Decoding Image Failed!');
      this.setState({
        loading: false
      });
      console.log(err);
    }
  };

  render() {
    if (this.state.loading) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: 'bold'
            }}
          >
            Please Wait while we are at it!
          </Text>
          <Image
            style={{
              height: HEIGHT / 2,
              width: WIDTH - 100,
              resizeMode: 'contain'
            }}
            source={wait}
          ></Image>
        </View>
      );
    }
    if (this.state.type == 'encoding') {
      return (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <KeyboardAvoidingView
            behavior='position'
            keyboardVerticalOffset={keyboardVerticalOffset}
          >
            <View
              style={{
                backgroundColor: '#fff',
                height: HEIGHT - 100,
                width: WIDTH - 50,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'space-around',
                position: 'relative'
              }}
            >
              <Text
                style={{
                  fontWeight: 'bold',
                  fontSize: 24
                }}
              >
                Patient
              </Text>
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  right: 10,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={() => {
                  this.setState({
                    text: null,
                    data: null,
                    type: 'encoding',
                    image: false,
                    imageSelect: null,
                    isUploading: false,
                    mainImage: false,
                    base64send: null,
                    b64: null,
                    loading: false,
                    key: null,
                    wb64: null
                  });
                  console.log('State resetted!');
                }}
              >
                <Text
                  style={{
                    color: '#4286f4'
                  }}
                >
                  New
                </Text>
                <EvilIcons name='refresh' size={32} color='#4286f4' />
              </TouchableOpacity>
              <Image
                source={jiitLogo}
                style={{
                  width: 100,
                  height: 150,
                  resizeMode: 'contain',
                  borderRadius: 20
                }}
              />
              <TextInput
                placeholder='Enter Disease Name'
                style={{
                  height: 40,
                  width: WIDTH - 100,
                  borderWidth: 0,
                  textAlign: 'center',
                  color: 'black',
                  backgroundColor: '#fff',
                  borderBottomColor: '#d9d9d9',
                  borderBottomWidth: 2
                }}
                onChangeText={text => this.setState({ text: text })}
              />
              <TouchableOpacity
                style={{
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={() => this.encode()}
              >
                <Text
                  style={{
                    alignItems: 'center',
                    textAlign: 'center',
                    width: WIDTH - 100,
                    fontWeight: 'bold',
                    fontSize: 15,
                    backgroundColor: '#404040',
                    height: 50,
                    paddingTop: 15,
                    color: 'white',
                    elevation: 1,
                    borderRadius: 20
                  }}
                >
                  Upload Disease
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  this.setState({
                    type: 'decoding'
                  });
                }}
              >
                <Text
                  style={{
                    fontWeight: 'bold',
                    fontSize: 20,
                    textAlign: 'center',
                    width: 350,
                    color: '#4286f4'
                  }}
                >
                  Click To Change to Doctor
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      );
    }
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <KeyboardAvoidingView
          behavior='position'
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          <View
            style={{
              backgroundColor: '#fff',
              height: HEIGHT - 100,
              width: WIDTH - 50,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'space-around',
              position: 'relative'
            }}
          >
            <Text
              style={{
                fontWeight: 'bold',
                fontSize: 24
              }}
            >
              Doctor
            </Text>
            <TouchableOpacity
              style={{
                position: 'absolute',
                right: 10,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onPress={() => {
                this.setState({
                  text: null,
                  data: null,
                  type: 'encoding',
                  image: false,
                  imageSelect: null,
                  isUploading: false,
                  mainImage: false,
                  base64send: null,
                  b64: null,
                  loading: false
                });
                console.log('State resetted!');
              }}
            >
              <Text
                style={{
                  color: '#4286f4'
                }}
              >
                New
              </Text>
              <EvilIcons name='refresh' size={32} color='#4286f4' />
            </TouchableOpacity>
            <Image
              source={jiitLogo}
              style={{
                width: 100,
                height: 150,
                resizeMode: 'contain',
                borderRadius: 20
              }}
            />
            <TextInput
              placeholder='Enter Medicine Name'
              style={{
                height: 40,
                width: WIDTH - 100,
                borderWidth: 0,
                textAlign: 'center',
                color: 'black',
                backgroundColor: '#fff',
                borderBottomColor: '#d9d9d9',
                borderBottomWidth: 2
              }}
              onChangeText={text => this.setState({ text: text })}
            />

            <TouchableOpacity onPress={() => this.decode()}>
              <Text
                style={{
                  alignItems: 'center',
                  textAlign: 'center',
                  width: WIDTH - 100,
                  fontWeight: 'bold',
                  fontSize: 15,
                  backgroundColor: '#404040',
                  height: 50,
                  paddingTop: 15,
                  color: 'white',
                  elevation: 1,
                  borderRadius: 20
                }}
              >
                Upload Medicine Name
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (this.state.type == 'encoding') {
                  this.setState({
                    type: 'decoding'
                  });
                } else {
                  this.setState({
                    type: 'encoding'
                  });
                }
              }}
            >
              <Text
                style={{
                  fontWeight: 'bold',
                  fontSize: 20,
                  textAlign: 'center',
                  width: 350,
                  color: '#4286f4'
                }}
              >
                Click To Change for Patient
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }
}
