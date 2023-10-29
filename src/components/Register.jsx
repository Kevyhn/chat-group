import {Link, useNavigate} from 'react-router-dom'
import {useState} from 'react'
import {useAuth} from '../context/authContext'
import {doc, setDoc} from 'firebase/firestore';
import {db, storage} from '../firebase'
import {ref, getDownloadURL} from 'firebase/storage'

const Register = () => {
	const [user, setUser] = useState({	
		name: '',
		email: '',
		password: ''
	})
	const {signup} = useAuth();
	const navigate = useNavigate();
	const [error, setError] = useState('');

	const handleChange = ({target: {name, value}}) => {		
		setUser({...user, [name]: value});		
	}	

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		try {
			let userId = await signup(user.email, user.password);									
			const storageRef = ref(storage, 'avatar/default.jpg');
    		const url = await getDownloadURL(storageRef);  			
			await setDoc(doc(db, 'users', userId.user.uid), {id: userId.user.uid, name: user.name, description: '', avatar: url});			
			navigate('/');
		} catch (error) {
			console.log(error.message)
			let message = error.message.split(':')[1].trim();
			setError(message);
			console.clear();
			setTimeout(() => {
				setError('');
			}, 5000);
		}		
	}

	return (
		<div className="login-register">
			{error.length >= 1 ? <div className="error-msg">{error}</div> : ''}
			<div className="form">
				<h2>Register</h2>				
				<form onSubmit={handleSubmit}>	
					<input type="text" name="name" placeholder="Enter your name" onChange={handleChange}/>										
					<input type="email" name="email" placeholder="Enter your email" onChange={handleChange}/>					
					<input type="password" name="password" placeholder="Enter your password" onChange={handleChange}/>				
					<input type="submit" value="Register"/>												
				</form>
				<p>Already have an account? <Link to="/login">Login</Link></p>								
			</div>				
		</div>
	)
}

export default Register;