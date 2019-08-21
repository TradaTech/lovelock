import React from 'react';
import styled from 'styled-components';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import CommonDialog from './CommonDialog';
import { TagTitle } from './Promise';
import tweb3 from '../../service/tweb3';
import { connect } from 'react-redux';

const useStyles = makeStyles(theme => ({
  textMulti: {
    marginLeft: theme.spacing(0),
    marginRight: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
}));

function TextFieldMultiLine(props) {
  const classes = useStyles();
  return <TextField className={classes.textMulti} {...props} />;
}

const IconView = styled.div`
  color: #8250c8;
`;

class PromiseConfirm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      messageAccept: '',
      messageDeny: '',
    };
  }

  messageAcceptChange = e => {
    const value = e.target.value;
    this.setState({
      messageAccept: value,
    });
  };

  messageDenyChange = e => {
    const value = e.target.value;
    this.setState({
      messageDeny: value,
    });
  };

  async messageAccept(message) {
    const { index, privateKey, address } = this.props;
    try {
      const ct = tweb3.contract(process.env.contract);
      const name = 'acceptPropose';
      tweb3.wallet.importAccount(privateKey);
      tweb3.wallet.defaultAccount = address;
      const result = await ct.methods[name](index, message).sendCommit();
      console.log('View result', result);
      if (result) {
        // window.alert("send success");
        // notifi.info("Success!");
        this.props.close();
      }
    } catch (error) {
      console.log(error);
    }
  }

  async messageDeny(message) {
    const { index } = this.props;
    try {
      const ct = tweb3.contract(process.env.contract);
      const name = 'cancelPropose';
      const result = await ct.methods[name](index, message).sendCommit();
      console.log('View result', result);
      if (result) {
        window.alert('Success');
        // notifi.info("Success!");
        this.props.close();
      }
    } catch (error) {
      console.log(error);
    }
  }

  render() {
    const { close, send, isDeny } = this.props;
    const { messageAccept, messageDeny } = this.state;
    return (
      <CommonDialog
        title="Promise alert"
        okText="Send"
        cancelText="Cancel"
        close={close}
        cancel={close}
        confirm={() => {
          if (!isDeny) {
            this.messageAccept(messageAccept);
          } else {
            this.messageDeny(messageDeny);
          }
        }}
        isCancel
      >
        <TagTitle>{isDeny ? 'Your message (optional)' : 'Your message'}</TagTitle>
        {isDeny ? (
          <TextFieldMultiLine
            id="outlined-multiline-static"
            placeholder="I don’t care"
            multiline
            fullWidth
            rows="5"
            margin="normal"
            variant="outlined"
            onChange={this.messageDenyChange}
          />
        ) : (
          <div>
            <TextFieldMultiLine
              id="outlined-multiline-static"
              placeholder="Like your promise"
              multiline
              fullWidth
              rows="5"
              margin="normal"
              variant="outlined"
              onChange={this.messageAcceptChange}
            />
            <IconView>
              <i className="material-icons">insert_photo</i>
            </IconView>
          </div>
        )}
      </CommonDialog>
    );
  }
}

PromiseConfirm.defaultProps = {
  isDeny: false,
  index: 0,
  send() {},
  close() {},
};

const mapStateToProps = state => {
  const { propose, account } = state;
  return {
    propose: propose.propose,
    currentIndex: propose.currentProIndex,
    memory: propose.memory,
    address: account.address,
    privateKey: account.privateKey,
  };
};

export default connect(
  mapStateToProps,
  null
)(PromiseConfirm);
