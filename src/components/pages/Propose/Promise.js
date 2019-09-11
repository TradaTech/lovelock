import React from 'react';
import styled from 'styled-components';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import CustomPost from './Detail/CustomPost';
import CommonDialog from './CommonDialog';
import { saveToIpfs, sendTransaction } from '../../../helper/index';
import { connect } from 'react-redux';
import notifi from '../../elements/Notification';
import * as actions from '../../../store/actions';
import Autosuggest from 'react-autosuggest';
import { tryStringifyJson } from '../../../helper/utils';
import tweb3 from '../../../service/tweb3';
import AutosuggestHighlightMatch from 'autosuggest-highlight/match';
import AutosuggestHighlightParse from 'autosuggest-highlight/parse';
import { withSnackbar } from 'notistack';
import AddInfoMessage from '../../elements/AddInfoMessage';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { FlexBox } from '../../elements/StyledUtils';
import { ValidatorForm, TextValidator } from 'react-material-ui-form-validator';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {
    marginLeft: theme.spacing(0),
    marginRight: theme.spacing(1),
    marginBottom: theme.spacing(4),
  },
  textMulti: {
    marginLeft: theme.spacing(0),
    marginRight: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
}));

const CustCheckbox = withStyles({
  root: {
    color: '#fe8dc3',
    '&$checked': {
      color: 'fe8dc3',
    },
  },
  checked: {},
})(props => <Checkbox color="default" {...props} />);

function TextFieldPlaceholder(props) {
  const classes = useStyles();
  return <TextField className={classes.textField} {...props} />;
}

function TextFieldMultiLine(props) {
  const classes = useStyles();
  return <TextField className={classes.textMulti} {...props} />;
}

export const TagTitle = styled.div`
  width: 100%;
  height: 18px;
  font-family: Montserrat;
  font-size: 16px;
  font-weight: 500;
  font-style: normal;
  font-stretch: normal;
  line-height: normal;
  letter-spacing: normal;
  color: #141927;
  .highlight {
    color: #8250c8;
  }
`;
class Promise extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      partner: '',
      promiseStm: '',
      date: new Date(),
      file: '',
      hash: '',
      value: '',
      suggestions: [],
      checked: false,
    };
  }

  componentWillUnmount() {
    clearTimeout(this.timeoutHanle1);
    clearTimeout(this.timeoutHanle2);
  }

  partnerChange = e => {
    const value = e.target.value;
    this.setState({
      partner: value,
    });
    // console.log("view partnerChange", value);
  };

  promiseStmChange = e => {
    const value = e.target.value;
    this.setState({
      promiseStm: value,
    });
    // console.log("view promiseStmChange", value);
  };

  onChangeCus = (date, file) => {
    console.log('view Date', date);
    console.log('view File', file);
    this.setState({ date, file });
  };

  onChangeDate = date => {
    this.setState({ date });
  };
  onChangeMedia = file => {
    this.setState({ file });
  };

  async createPropose(partner, promiseStm, date, file) {
    const { setLoading } = this.props;
    let hash;
    setLoading(true);

    this.timeoutHanle1 = setTimeout(async () => {
      try {
        if (file) {
          hash = await saveToIpfs(file);
        }
        let info = {
          date: date,
          hash: hash,
        };
        info = JSON.stringify(info);
        const name = 'createPropose';
        if (!partner) {
          const message = 'Please choose your partner.';
          this.props.enqueueSnackbar(message, { variant: 'error' });
          setLoading(false);
          return;
        }
        if (!promiseStm) {
          const message = 'Please input your promise.';
          this.props.enqueueSnackbar(message, { variant: 'error' });
          setLoading(false);
          return;
        } else {
          const params = [promiseStm, partner, info];

          const result = await sendTransaction(name, params);

          this.timeoutHanle2 = setTimeout(() => {
            if (result) {
              // notifi.info('Success');
              const message = 'Your propose send successfully.';
              this.props.enqueueSnackbar(message, { variant: 'success' });
              setLoading(false);
              this.props.close();
            }
          }, 50);
        }
      } catch (err) {
        // console.log(err);
        setLoading(false);
      }
    }, 100);
  }

  escapeRegexCharacters(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async getSuggestions(value) {
    let escapedValue = this.escapeRegexCharacters(value.trim());

    if (escapedValue === '@' || escapedValue === '') {
      this.setState({
        suggestions: [],
      });
    }

    let people = [];
    escapedValue = escapedValue.substring(escapedValue.indexOf('@') + 1);
    // console.log('escapedValue', escapedValue);

    const regex = new RegExp('\\b' + escapedValue, 'i');
    try {
      const method = 'callReadonlyContractMethod';
      const add = 'system.alias';
      const func = 'query';
      if (escapedValue.length > 2) {
        const result = await tweb3[method](add, func, [escapedValue]);
        people = Object.keys(result).map(function(key, index) {
          const nick = key.substring(key.indexOf('.') + 1);
          return { nick: nick, address: result[key].address };
        });
      }
    } catch (err) {
      console.log(tryStringifyJson(err));
    }

    people = people.filter(person => regex.test(this.getSuggestionValue(person)));
    people = people.slice(0, 10);

    this.setState({
      suggestions: people,
    });
  }

  getSuggestionValue(suggestion) {
    return `@${suggestion.nick}`;
  }

  renderSuggestion(suggestion) {
    return <div>{suggestion.nick}</div>;
  }

  renderSuggestion1(suggestion, { query }) {
    const suggestionText = `${suggestion.nick}`;
    const matches = AutosuggestHighlightMatch(suggestionText, query);
    const parts = AutosuggestHighlightParse(suggestionText, matches);

    return (
      <span className="suggestion-content">
        <span>
          <img src="/static/img/user-men.jpg" alt="itea" />
        </span>
        <span className="name">
          {parts.map((part, index) => {
            const className = part.highlight ? 'highlight' : null;

            return (
              <span className={className} key={index}>
                {part.text}
              </span>
            );
          })}
        </span>
      </span>
    );
  }

  onChange = (event, { newValue }) => {
    const name = newValue.substring(1);
    // console.log('newValue', newValue);
    const { suggestions } = this.state;
    let address = '';
    if (suggestions) {
      const seletedItem = suggestions.filter(item => item.nick === name);
      if (seletedItem && seletedItem.length > 0) {
        address = seletedItem[0].address;
      }
      console.log('add', address);
    }
    this.setState({
      value: newValue,
      partner: address,
    });
  };

  onSuggestionsFetchRequested = ({ value }) => {
    this.getSuggestions(value);
    // this.setState({
    //   suggestions: this.getSuggestions(value),
    // });
  };

  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: [],
    });
  };

  handleCheckChange = e => {
    document.activeElement.blur();
    this.setState({
      checked: e.target.checked,
    });
  };

  render() {
    const { close } = this.props;
    const { partner, promiseStm, date, file, suggestions, value, checked } = this.state;
    console.log('partner', partner);

    const inputProps = {
      placeholder: '@partner',
      value,
      onChange: this.onChange,
    };

    return (
      <ValidatorForm onSubmit={this.gotoNext}>
        <CommonDialog
          title="Promise"
          okText="Send"
          close={close}
          confirm={() => {
            this.createPropose(partner, promiseStm, date, file);
          }}
        >
          <TagTitle>Tag your partner you promise</TagTitle>
          {/* <TextFieldPlaceholder
          id="outlined-helperText"
          placeholder="@partner"
          margin="normal"
          variant="outlined"
          fullWidth
          onChange={this.partnerChange}
        /> */}
          <Autosuggest
            suggestions={suggestions}
            onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
            onSuggestionsClearRequested={this.onSuggestionsClearRequested}
            getSuggestionValue={this.getSuggestionValue}
            renderSuggestion={this.renderSuggestion1}
            inputProps={inputProps}
          />
          <FormControlLabel
            control={<CustCheckbox checked={checked} onChange={this.handleCheckChange} value="checked" />}
            label="or Send request to your crush(Imaginary Lover)"
          />
          {checked && (
            <FlexBox>
              <TextValidator
                label="First Name"
                fullWidth
                // onChange={this.handleUsername}
                name="firstname"
                validators={['required']}
                errorMessages={['This field is required']}
                // className={classes.marginRight}
                margin="normal"
                // value={firstname}
              />
              <TextValidator
                label="Last Name"
                fullWidth
                // onChange={this.handleUsername}
                name="lastname"
                validators={['required']}
                errorMessages={['This field is required']}
                margin="normal"
                // value={lastname}
              />
            </FlexBox>
          )}
          <TagTitle>Your promise</TagTitle>
          <TextFieldMultiLine
            id="outlined-multiline-static"
            placeholder="your promise ..."
            multiline
            fullWidth
            rows="5"
            margin="normal"
            variant="outlined"
            onChange={this.promiseStmChange}
          />
          {/* <CustomPost onChange={this.onChangeCus} /> */}
          <AddInfoMessage
            files={file}
            date={date}
            onChangeDate={this.onChangeDate}
            onChangeMedia={this.onChangeMedia}
          />
        </CommonDialog>
      </ValidatorForm>
    );
  }
}

Promise.defaultProps = {
  send() {},
  close() {},
};

const mapStateToProps = state => {
  const { loveinfo, account } = state;
  return {
    propose: loveinfo.propose,
    currentIndex: loveinfo.currentProIndex,
    memory: loveinfo.memory,
    address: account.address,
    privateKey: account.privateKey,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setLoading: value => {
      dispatch(actions.setLoading(value));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withSnackbar(Promise));
