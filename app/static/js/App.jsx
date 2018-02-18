import React, {Component} from "react"
import ReactCamera from "simple-react-camera"
import axios from "axios"
import io from "socket.io-client"

const socket = io(process.env.RASPI_URL)

const imgStyle = {
  height: "200px",
  width: "200px",
}

const buttonStyle = {
  height: "20px",
  width: "200px",
}

const containerStyle = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
}

const piConditionalStyle = {
  width: "200px",
  height: "100px",
}

const imageStyle = {
  display: "flex",
  flexDirection: "row",
  flexBasis: "auto",
  justifyContent: "space-around",
}

export default class App extends Component {
  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
    this.chooseCam = this.chooseCam.bind(this)
    this.turnOnMotion = this.turnOnMotion.bind(this)
    this.camera = null
    this.state = {
      image: "",
      webCam: false,
      takeOnPi: true,
    }
    this.turnOnSocket()
  }

  turnOnSocket() {
    socket.on("connect", () => console.log("connected"))
    socket.on("motion response", data => console.log(data))
    socket.on("detector running", data => console.log(data))
    socket.on("disconnect", () => console.log("disconnected :("))
  }

  chooseCam(cam) {
    if (cam === "pi") {
      this.setState({takeOnPi: true})
    } else {
      window.navigator.mediaDevices
        .getUserMedia({video: true})
        .then(() => {
          this.setState({webCam: true, takeOnPi: false})
        })
        .catch(e => console.error(e))
    }
  }

  turnOnMotion() {
    if (this.state.motionDetector === "on") {
      socket.emit("motion", "off")
      this.setState({motionDetector: "off"})
    } else {
      socket.emit("motion", "on")
      this.setState({motionDetector: "on"})
    }
  }

  handleClick() {
    if (this.state.takeOnPi) {
      axios.get(`${process.env.RASPI_URL}/take`).then(resp => {
        this.setState({image: resp.data.data})
      })
    } else {
      this.camera
        .snapshot()
        .then(data => {
          /* data: string (base-64-jqeg)
               Process your data here*/
          this.setState({image: data})
        })
        .catch(console.error)
    }
  }

  render() {
    const {takeOnPi} = this.state
    return (
      <div style={containerStyle}>
        <div style={piConditionalStyle}>
          <p>Use camera on pi?</p>
          <button
            onClick={() => {
              this.chooseCam("pi")
            }}
          >
            YES
          </button>
          <button
            onClick={() => {
              this.chooseCam("web")
            }}
          >
            NO
          </button>
        </div>
        <div style={imageStyle}>
          {!takeOnPi && (
            <ReactCamera
              classNames={"yourCssClassHere"}
              ref={camera => (this.camera = camera)}
              width={800}
              height={500}
            />
          )}
          <img style={imgStyle} src={this.state.image} />
        </div>
        <button style={buttonStyle} onClick={this.handleClick}>
          TAKE PICTURE
        </button>
        <button style={buttonStyle} onClick={this.turnOnMotion}>
          TURN MOTION DETECTOR{" "}
          {this.state.motionDetector === "on" ? "OFF" : "ON"}
        </button>
      </div>
    )
  }
}
