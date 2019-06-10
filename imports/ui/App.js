import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";
import { ReactiveVar } from "meteor/reactive-var";
import { Tasks } from "../api/tasks.js";
import Slider from "rc-slider";
import DatePicker from "react-datepicker";
 
import "react-datepicker/dist/react-datepicker.css";
import "rc-slider/assets/index.css";

import Task from "./Task.js";
import AccountsUIWrapper from "./AccountsUIWrapper.js";
import moment from "moment";

// App component - represents the whole app

// Reactive variable for dynamic sorting
const sortBy = new ReactiveVar({ createdAt: -1 });

class App extends Component {
  constructor(props) {
    super(props);

    this.sortTypes = [
      { value: "createdAt", text: "Creation Date" },
      { value: "text", text: "Name" },
      { value: "completedBy", text: "Completed By Date" },
      { value: "priority", text: "Priority" }
    ];

    this.state = {
      hideCompleted: false,
      sortBy: { type: "createdAt", order: "desc" },
      selectedDate: '',
      sliderValue:1,
    };
  }

  handleSubmit(event) {
    event.preventDefault();

    // Find the text field via the React ref
    const text = ReactDOM.findDOMNode(this.refs.textInput).value.trim();

    const date = ReactDOM.findDOMNode(this.refs.datePicker).childNodes[0].childNodes[0].value;
    ReactDOM.findDOMNode(this.refs.textInput).focus();   
    this.refs.textInputValidation.innerHTML = '';
    this.refs.dateInputValidation.innerHTML = '';

    if(!text.match(/^[a-zA-Z0-9_]{5,}( [a-zA-Z0-9_]+)*$/g))
    { this.refs.textInputValidation.innerHTML = 'Task name does not meet all requirements:\n-At least 5 characters,spaces allowed only between words';
      return;
    }
    if(!moment(date,'MMMM D, YYYY HH:mm').isValid())
    {
      this.refs.dateInputValidation.innerHTML ='Creation date invalid format:\n-Must be e.g. June 28, 2019 15:00';
      return;
    }

    const priority = this.state.sliderValue;

    Meteor.apply("tasks.insert", [text, date,priority]);

    // Clear form
    ReactDOM.findDOMNode(this.refs.textInput).value = "";
    this.setState({
      selectedDate:''
    })
  }

  toggleHideCompleted() {
    this.setState({
      hideCompleted: !this.state.hideCompleted
    });
  }

  sortByChanged(event) {
    const val = event.target.value,
      val_type = val.substring(0, val.lastIndexOf("_")),
      val_order = val.substring(val.lastIndexOf("_") + 1),
      val_state = {};
      //handle state variable for component
    this.setState({
      sortBy: { type: val_type, order: val_order }
    });
    val_state[val_type] = val_order == "asc" ? 1 : -1;
    //setting reactive variable,visible both to class and withTracker wrapper
    sortBy.set(val_state);
  }

  handleDateChange(date) {
     
    this.setState({
      selectedDate: date
    });
  }

  handleSliderChange(value){
    
    this.setState({
      sliderValue: value
    });

  }

  renderTasks() {
    let filteredTasks = this.props.tasks;
    if (this.state.hideCompleted) {
      filteredTasks = filteredTasks.filter(task => !task.checked);
    }
    return filteredTasks.map(task => {
      const currentUserId =
        this.props.currentUser && this.props.currentUser._id;
      const showPrivateButton = task.owner === currentUserId;

      return (
        <Task
          key={task._id}
          task={task}
          showPrivateButton={showPrivateButton}
        />
      );
    });
  }

  render() {
    return (
      <div className="container">
        <header>
          <h1>Todo List ({this.props.incompleteCount})</h1>

          <label className="hide-completed">
            <input
              type="checkbox"
              readOnly
              checked={this.state.hideCompleted}
              onClick={this.toggleHideCompleted.bind(this)}
            />
            Hide Completed Tasks
          </label>

          <AccountsUIWrapper />

          <div className="sort-by">
            <h5 className="sort-by_title">Sort By:</h5>
            <select
              value={this.state.sortBy.type + "_" + this.state.sortBy.order}
              onChange={this.sortByChanged.bind(this)}
            >
              {this.sortTypes.map((element, index) => {
                return ( 
                  
                  <React.Fragment>
                  {/* returning fragment eith two options - ascending and descending search,
                      so that data in sortTypes is not duplicating
                  */}
                    <option key={index + "_asc"} value={element.value + "_asc"}>
                      {element.text} &uarr;
                    </option>
                    <option
                      key={index + "_desc"}
                      value={element.value + "_desc"}
                    >
                      {element.text} &darr;
                    </option>
                  </React.Fragment>
                );
              })}
            </select>
          </div>

          {this.props.currentUser ? (
            <form className="new-task" onSubmit={this.handleSubmit.bind(this)}>
              <input
                type="text"
                ref="textInput"
                placeholder="Type to add new tasks, then press Enter or Create button"
                
              />
              <div ref="textInputValidation" class="validationMessage">
              </div>
              <div>
              <div className="priority_title">
                <h5 className="">Set priority:</h5>
              </div>
              <div className="priority_slider">
                <Slider
                  min={1}
                  max={5}
                  value={this.state.sliderValue}
                  onChange={this.handleSliderChange.bind(this)}
                  defaultValue={1}
                  marks={{ 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 }}
                  step={null}
                />
              </div>
            </div>
  
            <div>
            <h5 className="creation_date_title">Set Complete By Date:</h5>
              <DatePicker
              ref="datePicker"
                minDate={new Date()}
                selected={this.state.selectedDate}
                onChange={this.handleDateChange.bind(this)}
                placeholderText="e.g. June 28, 2019 12:00"
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy hh:mm"
                timeCaption="time"
              />
              <div ref="dateInputValidation" class="validationMessage">
              </div>
            </div>

              <button type="submit" className="createButton">Create</button>
            </form>
          ) : (
            ""
          )}

       
        </header>

        <ul>{this.renderTasks()}</ul>
      </div>
    );
  }
}

export default withTracker(() => {
  Meteor.subscribe("tasks");

  return {
    tasks: Tasks.find({}, { sort: sortBy.get() }).fetch(),
    incompleteCount: Tasks.find({ checked: { $ne: true } }).count(),
    currentUser: Meteor.user()
  };
})(App);
