import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import classnames from "classnames";
import moment from "moment";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

import { Tasks } from "../api/tasks.js";

// Task component - represents a single todo item
export default class Task extends Component {
  toggleChecked() {
    // Set the checked property to the opposite of its current value
    Meteor.call(
      "tasks.setChecked",
      this.props.task._id,
      !this.props.task.checked
    );
  }

  constructor(props){
    super(props);
  this.state={
    priority:this.props.task.priority,
  }

  }

  deleteThisTask() {
    Meteor.call("tasks.remove", this.props.task._id);
  }

  togglePrivate() {
    Meteor.call(
      "tasks.setPrivate",
      this.props.task._id,
      !this.props.task.private
    );
  }

  handleSliderChange(value) {
    this.setState({
      priority:value,
    });
    Meteor.apply(
      "tasks.setPriority",
      [this.props.task._id,value]
    );
  }

  render() {
    // Give tasks a different className when they are checked off,
    // so that we can style them nicely in CSS
    const taskClassName = classnames({
      checked: this.props.task.checked,
      private: this.props.task.private
    });

    return (
      <li className={taskClassName}>
        <button className="delete" onClick={this.deleteThisTask.bind(this)}>
          &times;
        </button>

        <input
          type="checkbox"
          readOnly
          checked={!!this.props.task.checked}
          onClick={this.toggleChecked.bind(this)}
        />

        {this.props.showPrivateButton ? (
          <button
            className="toggle-private"
            onClick={this.togglePrivate.bind(this)}
          >
            {this.props.task.private ? "Private" : "Public"}
          </button>
        ) : (
          ""
        )}

        <div className="text ">
          <strong>{this.props.task.username}</strong>: {this.props.task.text}
        </div>

        <div className="text">
          <strong>Created on:</strong>{" "}
          {moment(this.props.task.createdAt).format("DD/MM/YYYY HH:mm")}
        </div>
        <div className="text">
          <strong>Complete By:</strong>{" "}
          {moment(this.props.task.completedBy).format("DD/MM/YYYY HH:mm")}
        </div>
        <div className="text">
          <div className="priority_title">
             
              <strong>Priority:</strong>
             
          </div>
          <div className="priority_slider">
            <Slider
              min={1}
              max={5}
              value={this.state.priority}
              onChange={this.handleSliderChange.bind(this)}
              defaultValue={1}
              marks={{ 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 }}
              step={null}
            />
          </div>
        </div>
      </li>
    );
  }
}
