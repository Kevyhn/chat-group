import {useRef, useState, useEffect} from 'react'
import {useAuth} from '../context/authContext'
import {doc, collection, getDocs, getDoc, setDoc, deleteDoc, updateDoc} from 'firebase/firestore'
import {ref, uploadBytes, getDownloadURL} from 'firebase/storage'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faRefresh, faX, faPaperPlane, faBars, faCrown, faChevronDown, faChevronLeft, faPlus, faMagnifyingGlass, faCircleUser, faRightToBracket} from '@fortawesome/free-solid-svg-icons'
import {db, storage} from '../firebase'
import {v4 as uuidv4} from 'uuid'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

const Main = () => {
  useEffect(() => {
    getDefaultChannel();
    getUserProfile();
    getChannels(); 
    if (window.innerWidth <= 700) {
      setClose(true);
      showNav();
    }    
  }, []);  

  dayjs.extend(relativeTime);

  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState({});
  const [channels, setChannels] = useState([]);
  const [channel, setChannel] = useState([{}]);
  const [loading, setLoading] = useState(false);
  const [loadingDot, setLoadingDot] = useState(false);
  const [joined, setJoined] = useState(false);  
  const [showProfile, setShowProfile] = useState(false);
  const [updateProfile, setUpdateProfile] = useState(false);
  const [userMember, setUserMember] = useState({});
  const [update, setUpdate] = useState(false);
  const [close, setClose] = useState(false);
  const [defaultChannel, setDefaultChannel] = useState({});
  const {logout, user} = useAuth();
  const options = useRef();
  const chatPanel = useRef();
  const searchInp = useRef();
  const nav = useRef();
  const profileNav = useRef();

  const hadleOptions = () => {
    options.current.classList.toggle('hidden-options');
  }

  const createChannel = async (e) => {
    try {
      e.preventDefault();
      let channel = {};
      let target = e.target;
      for (let i = 0; i <= target.length - 2; i++) {  
        if (target[i].value.length <= 0) {
          alert('Error: Complete the fields');
          return null
        }
        channel[target[i].name] = target[i].value;
      }      
      channel.id = uuidv4();
      channel.members = [];
      profile.owner = true;
      channel.members.push(profile);                              
      await setDoc(doc(db, 'channels', channel.id), {channel});
      getChannels();     
      setOpen(false);      
    } catch (error) {
      console.log(error.message);
    }
  }

  const getUserProfile = async () => {
    try {
      const req = doc(db, 'users', user.uid);    
      const res = await getDoc(req);
      let userProfile = res.data();
      setProfile(userProfile);
    } catch (error) {
      console.log(error.message);
    }
  }

  const getChannels = async () => {
    try {            
      const querySnapshot = await getDocs(collection(db, 'channels'));         
      const allChannels = [];    
      querySnapshot.forEach((doc) => {      
        const data = doc.data();
        delete data.channel.members;
        delete data.channel.chat;
        data.channel.avatar = '';
        data.channel.name = data.channel.name.toUpperCase();          
        let nameSplit = data.channel.name.split(' ');     
        if (nameSplit.length <= 1) {
          data.channel.avatar = nameSplit[0].split('')[0];
        } else {        
          for (let i = 0; i <= 1; i++) {          
            data.channel.avatar += nameSplit[i].split('')[0];
          }
        }      
        allChannels.push(data.channel);          
      })           
      setChannels(allChannels);    
      return allChannels;
    } catch(error) {
      console.log(error.message);
    }
  }

  const getChannel = async (id) => {
    try {
      setDefaultChannel({});
      setChannel({});
      if (id === '1') {
        getDefaultChannel();
        return null;
      }      
      setLoading(true);
      const req = doc(db, 'channels', id);
      const res = await getDoc(req);
      const {channel} = res.data();            
      setChannel(channel);
      isJoined(channel, user);             
      setLoading(false); 
      if (window.innerWidth <= 700) {
        setClose(true);
        showNav();
      }    
      setTimeout(() => {
        chatPanel.current.scrollTop = chatPanel.current.scrollHeight;  
      }, 2000) 
    } catch(error) {
      console.log(error.message);
    }
  }

  const isJoined = (channel, user) => {  
    const subscribe = channel.members.filter(member => member.id === user.uid);
    if (subscribe.length >= 1) setJoined(true);    
    else setJoined(false);
  }

  const subscribeUser = async (user, channelId) => {
    try {
      const req = doc(db, 'channels', channelId);
      const res = await getDoc(req);
      const {channel} = res.data();    
      channel.members.push(user);    
      updateChannel(channel);
      setJoined(true);
      setChannel(channel);
    } catch(error) {
      console.log(error.message);
    }
  }

  const unsubscribeUser = async (user, channelId) => {
    try {
      const req = doc(db, 'channels', channelId);
      const res = await getDoc(req);
      const {channel} = res.data();
      let members = channel.members;
      let isOwner = members.filter(member => ((member.owner) && member.id === user.id));      
      if (isOwner.length >= 1) {
        if (confirm('If you leave the channel it is deleted, do you want to delete it?')) {
          await deleteDoc(doc(db, 'channels', channelId));
          getChannels();
          setChannel({});
        }
        return null;
      }          
      members.forEach(async (element) => {
        let currentMembers = members.filter(member => member.id !== user.id);
        channel.members = currentMembers;        
        updateChannel(channel);        
        setJoined(false);
        setChannel(channel);    
      })    
    } catch(error) {
      console.log(error.message);
    }
  }

  const updateChannel = async (channel) => {
    try {
      await setDoc(doc(db, 'channels', channel.id), {channel});   
      getChannels(); 
    } catch(error) {
      console.log(error.message);
    }          
  }

  const sendMessage = async (e) => {
    try {
      e.preventDefault();     
      let messageUser = {};
      let target = e.target[0];           
      if (target.value.length <= 0) return null;
      messageUser.id = uuidv4();
      messageUser.userId = user.uid;
      messageUser.user = profile.name;
      messageUser.message = target.value;
      messageUser.timeStamps = new Date().toString();
      messageUser.dateString = dayjs().format('MMMM D, YYYY');
      messageUser.avatar = profile.avatar;   
      if (channel.chat === undefined) {
        channel.chat = [];
        channel.chat.push({id: uuidv4(), date: messageUser.dateString, messages: [messageUser]});
      } else {      
        let index = channel.chat.findIndex(element => element.date === messageUser.dateString);
        if (index >= 0) {
          channel.chat[index].messages.push(messageUser)                    
          channel.chat.forEach(date => {      
            date.messages.forEach(msg => {                                                                  
              if (msg.userId === user.uid) {
                msg.user = profile.name;
                msg.avatar = profile.avatar;
              }                          
            })        
          })                             
        } else channel.chat.push({id: uuidv4(), date: messageUser.dateString, messages: [messageUser]});            
      }
      updateChannel(channel);      
      target.value = "";
      setTimeout(() => {
        chatPanel.current.scrollTop = chatPanel.current.scrollHeight;  
      }, 3000)      
    } catch (error) {
      console.log(error.message);
    }
  }

  const getUser = async (id) => {  
    try {      
      setLoading(true);
      const req = doc(db, 'users', id);
      const res = await getDoc(req);
      const data = res.data();
      setShowProfile(true);
      if (id === profile.id) setUpdateProfile(true);        
      setUserMember(data);          
      setLoading(false);
    } catch(error) {
      console.log(error.message);
    }
  }

  const updateUser = async (e, id) => {
    try {      
      e.preventDefault();
      setLoadingDot(true);      
      let userToUpdate = {};
      userToUpdate.id = id;
      let target = e.target.childNodes;                  
      let elementFile = undefined;
      target.forEach(element => {                         
        if (element.name) userToUpdate[element.name] = element.value;                 
        if (element.type === 'file') {
          if (element.files.length <= 0) return null;
          elementFile = element.files[0];            
        }                                 
      })    
      if (userToUpdate.name.length <= 0) {
        alert('Error: Complete the fields');
        setLoadingDot(false);
        return null;
      }  
      await setAvatar(elementFile);                          
      let avatarUrl = await getAvatar(id);                                              
      if (!avatarUrl) avatarUrl = profile.avatar;      
      await updateDoc(doc(db, 'users', id), {id, name: userToUpdate.name, description: userToUpdate.description, avatar: avatarUrl});     
      channels.forEach(async (element) => {  
        if (element.id === '1') return null;        
        const req = doc(db, 'channels', element.id);
        const res = await getDoc(req);
        const {channel} = res.data();                    
        channel.members.forEach(member => {          
          if (member.id === id) {      
            member.name = userToUpdate.name;
            member.avatar = avatarUrl;
          }                                                 
        }) 
        if (channel.chat) {
          channel.chat.forEach(date => {
            date.messages.forEach(msg => {                                                                  
              if (msg.userId === user.uid) {
                msg.user = userToUpdate.name;
                msg.avatar = avatarUrl;
              }                          
            }) 
          }) 
        }                          
        updateChannel(channel);        
      })                             
      setLoadingDot(false);    
      getUserProfile();
      setDefault();               
    } catch(error) {
      console.log(error.message);
    }
  } 

  const setDefault = () => {
    setShowProfile(false);
    setUpdateProfile(false);
    setUpdate(false); 
    setLoadingDot(false);
  }

  const searchChannel = async () => {    
    const allChannels = await getChannels();        
    let name = searchInp.current.value.toUpperCase();        
    if (name.length <= 0) setChannels(allChannels)
    else {
      const results = [];
      allChannels.forEach(channel => {              
        if (channel.name.includes(name)) {                  
          results.push(channel);
        }
      })
      setChannels(results);
    }    
  }

  const getDefaultChannel = async () => {
    const req = doc(db, 'channels', 'JNaXPz1oBzny44gZ7swu');
    const res = await getDoc(req);
    const {channel} = res.data();
    setDefaultChannel(channel);
    setChannel({});
  }

  const setAvatar = async (file) => {
    if (file === undefined) return null;
    const storageRef = ref(storage, `avatar/${user.uid}`);    
    await uploadBytes(storageRef, file);
  }

  const getAvatar = async (id) => {
    const storageRef = ref(storage, `avatar/${id}`);
    let url = await getDownloadURL(storageRef).then(url => url).catch(error => {      
      return null;
    })       
    return url;
  }

  const showNav = () => {      
    if (nav.current.style.left === '-300px') {        
      nav.current.style.left = '0px';
      profileNav.current.style.left = '0px';           
      setClose(false);
      if (window.innerWidth <= 380) { 
        nav.current.style.width = '80%';                          
        profileNav.current.style.width = '80%';
      }               
    } else {                             
      nav.current.style.left = '-300px';
      profileNav.current.style.left = '-300px';             
      setClose(true);
      if (window.innerWidth <= 380) {        
        nav.current.style.width = '300px';                        
      } 
    }       
  }

  return (
    <div className="Main">    
      <div className="nav" ref={nav}>
        <div className="close-nav-btn" onClick={showNav}>          
           {close ? <FontAwesomeIcon icon={faBars} style={{transform: 'rotate(0deg)'}}/> : <FontAwesomeIcon icon={faPlus}/>}          
        </div>        
        <div className="nav-header">
          <h4>Channels</h4>
          <div className="add" onClick={() => setOpen(true)}><FontAwesomeIcon icon={faPlus}/></div>
        </div>
        <div className="search-input">
          <FontAwesomeIcon icon={faMagnifyingGlass} onClick={() => searchChannel()}/>
          <input type="text" name="name" placeholder="Search" ref={searchInp}/>
        </div>        
        <div className="channels-list">
          {
            channels.map(element => {              
              return (
                <div className="channel" key={element.id} onClick={() => getChannel(element.id)}>
                  <div className="icon">{element.avatar}</div>
                  <h4 className="name">{element.name}</h4>
                </div>
              )
            })
          }               
        </div>
        <div className="user-profile" ref={profileNav}>
          <div className="user-options hidden-options" ref={options}>
            <div onClick={() => getUser(profile.id)}><FontAwesomeIcon icon={faCircleUser}/>My Profile</div>
            <div>Tweeter</div>            
            <hr/>
            <div className="logout" onClick={() => logout()}><FontAwesomeIcon icon={faRightToBracket} style={{color: '#f44336'}}/> Logout</div>
          </div>
          <div className="user-image">          
          <img src={profile.avatar ? profile.avatar : ''} alt=""/>
          </div>
          <h4>{profile.name}</h4>
          <div onClick={hadleOptions} className="show-options"><FontAwesomeIcon icon={faChevronDown}/></div>
        </div>   
        {loading ? <div className="spinner"></div> : ''}     
        {
          channel.id ? (
            <div className="channel-info">
              <div className="nav-channel">
                <div onClick={() => {
                  setChannel({});
                  getChannels();
                }}><FontAwesomeIcon icon={faChevronLeft}/></div>
                <h4>All channels</h4>
              </div>
              <h4 className="channel-name">{channel.name}</h4>
              <p className="channel-description">{channel.description}</p>
              {joined ? <button className="btn" style={{background: '#f44336'}} onClick={() => unsubscribeUser(profile, channel.id)}>Leave</button> : 
              <button className="btn" style={{background: '#4caf50'}} onClick={() => subscribeUser(profile, channel.id)}>Join</button>}
              <h4>Members</h4>
              {
                channel.members.map(element => {
                  return (
                    <div className="member" key={element.id} onClick={() => getUser(element.id)}>                      
                      <div className="member-avatar">                                            
                        <img src={element.avatar} alt=""/>                        
                      </div>
                      <h4 className="member-name">{element.name}</h4>
                      {element.owner ? <div className="owner"><FontAwesomeIcon icon={faCrown}/></div> : ''}                      
                    </div>
                  )
                })
              }
            </div>
          ) : ''
        }
      </div>
      {
        defaultChannel.id ? (
          <div className="channel-selected" style={{height: '100vh'}}>
            <div className="channel-name"><h4>{defaultChannel.name}</h4></div>                      
            <div className="chat">
              <h3 style={{textAlign: 'center'}}>{defaultChannel.description}</h3> 
              <h2 style={{textAlign: 'center'}}>👋 Hi {profile.name}, join a channel or create one</h2>
            </div>
          </div>          
        ) : ''
      }
      {
        channel.id ? (
          <div className="channel-selected" ref={chatPanel}>                    
            <div className="channel-name">
              <h4>{channel.name}</h4>
              <FontAwesomeIcon icon={faRefresh} className="refresh-btn" onClick={() => getChannel(channel.id)}/>              
            </div>
            <div className="chat">              
              {
                channel.chat ? channel.chat.map(element => {
                  return (
                    <div key={element.id} className="message-date">
                      <p className="date"><span>{element.date}</span></p>
                      {
                        element.messages.map(obj => {
                          return (
                            <div key={obj.id} className="user-message">
                              <div className="avatar">                                                            
                                <img src={obj.avatar} alt=""/>                       
                              </div>
                              <div>
                                <div className="message-info">
                                  <span className="user-name">{obj.user}</span>
                                  <span className="time-stamps">{dayjs(Date.parse(obj.timeStamps)).fromNow()}</span>
                                </div>
                                <p className="message">{obj.message}</p>
                              </div>                              
                            </div>
                          )
                        })
                      }
                    </div>
                  ) 
                }) : <p>This chat is empty</p>
              }
            </div>  
            {
              joined ? (
                <form className="send-message" onSubmit={sendMessage}>
                  <input type="text" name="message" placeholder="Type a message here"/>
                  <button><FontAwesomeIcon icon={faPaperPlane}/></button>
                </form> 
              ): <div className="send-message no-joined">Join to send a message</div>
            }                           
          </div>
        ) : ''
      }
      {
        open ? (
          <>
            <div className="bg-modal" onClick={() => setOpen(false)}></div>
            <div className="modal">
              <h3>NEW CHANNEL</h3>
              <form onSubmit={createChannel}>
                <input type="text" name="name" placeholder="Channel name" required/>                
                <textarea name="description" placeholder="Channel Description" required></textarea>
                <input type="submit" value="Save"/>
              </form>
            </div>
          </>
        ) : ''
      }   
      {
        showProfile ? (
          <>
            <div className="bg-modal" onClick={() => setDefault()}></div>                      
            <form className="modal edit-user" onSubmit={e => updateUser(e, userMember.id)}>                          
              {userMember.avatar || update ? <p>Avatar</p> : ''} 
              {update ? <input type="file"/> : <div className="edit-user-img"><img src={userMember.avatar} alt=""/></div>}
              {userMember.name ? <p>Name</p> : ''}
              {update ? <input type="text" name="name" defaultValue={userMember.name} required/> : <h4>{userMember.name}</h4>}                            
              {userMember.description || update ? <p>Description</p> : ''}
              {update ? <input type="text" name="description" defaultValue={userMember.description}/> : <h4 className="description">{userMember.description}</h4>}                                                                                   
              {
                updateProfile ? (                  
                  <>                  
                    {update ? <button>{loadingDot ? <div className="dots"></div> : 'Save'}</button> : <div className="edit-btn" onClick={() => setUpdate(true)}>Edit</div>}                  
                  </>                                   
                ) : ''
              }       
            </form>
          </>
        ) : ''
      }         
    </div>
  )
}

export default Main