/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Disabled,
	IconButton,
	PanelBody,
	SelectControl,
	Toolbar,
	ToggleControl,
	withNotices,
} from '@wordpress/components';
import { Component, Fragment } from '@wordpress/element';
import {
	BlockControls,
	InspectorControls,
	MediaPlaceholder,
	RichText,
	mediaUpload,
} from '@wordpress/editor';
import { getBlobByURL } from '@wordpress/blob';

class AudioEdit extends Component {
	constructor() {
		super( ...arguments );
		// edit component has its own src in the state so it can be edited
		// without setting the actual value outside of the edit UI
		this.state = {
			editing: ! this.props.attributes.src,
		};

		this.toggleAttribute = this.toggleAttribute.bind( this );
		this.onSelectURL = this.onSelectURL.bind( this );
	}

	componentDidMount() {
		const { attributes, noticeOperations, setAttributes } = this.props;
		const { id, src = '' } = attributes;

		if ( ! id && src.indexOf( 'blob:' ) === 0 ) {
			const file = getBlobByURL( src );

			if ( file ) {
				mediaUpload( {
					filesList: [ file ],
					onFileChange: ( [ { id: mediaId, url } ] ) => {
						setAttributes( { id: mediaId, src: url } );
					},
					onError: ( e ) => {
						setAttributes( { src: undefined, id: undefined } );
						this.setState( { editing: true } );
						noticeOperations.createErrorNotice( e );
					},
					allowedType: 'audio',
				} );
			}
		}
	}

	toggleAttribute( attribute ) {
		return ( newValue ) => {
			this.props.setAttributes( { [ attribute ]: newValue } );
		};
	}

	onSelectURL( newSrc ) {
		const { attributes, setAttributes } = this.props;
		const { src } = attributes;

		// Set the block's src from the edit component's state, and switch off
		// the editing UI.
		if ( newSrc !== src ) {
			setAttributes( { src: newSrc, id: undefined } );
		}

		this.setState( { editing: false } );
	}

	render() {
		const { autoplay, caption, loop, preload, src } = this.props.attributes;
		const { setAttributes, isSelected, className, noticeOperations, noticeUI } = this.props;
		const { editing } = this.state;
		const switchToEditing = () => {
			this.setState( { editing: true } );
		};
		const onSelectAudio = ( media ) => {
			if ( ! media || ! media.url ) {
				// in this case there was an error and we should continue in the editing state
				// previous attributes should be removed because they may be temporary blob urls
				setAttributes( { src: undefined, id: undefined } );
				switchToEditing();
				return;
			}
			// sets the block's attribute and updates the edit component from the
			// selected media, then switches off the editing UI
			setAttributes( { src: media.url, id: media.id } );
			this.setState( { src: media.url, editing: false } );
		};
		if ( editing ) {
			return (
				<MediaPlaceholder
					icon="media-audio"
					labels={ {
						title: __( 'Audio' ),
						name: __( 'an audio' ),
					} }
					className={ className }
					onSelect={ onSelectAudio }
					onSelectURL={ this.onSelectURL }
					accept="audio/*"
					type="audio"
					value={ this.props.attributes }
					notices={ noticeUI }
					onError={ noticeOperations.createErrorNotice }
				/>
			);
		}

		/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		return (
			<Fragment>
				<BlockControls>
					<Toolbar>
						<IconButton
							className="components-icon-button components-toolbar__control"
							label={ __( 'Edit audio' ) }
							onClick={ switchToEditing }
							icon="edit"
						/>
					</Toolbar>
				</BlockControls>
				<InspectorControls>
					<PanelBody title={ __( 'Audio Settings' ) }>
						<ToggleControl
							label={ __( 'Autoplay' ) }
							onChange={ this.toggleAttribute( 'autoplay' ) }
							checked={ autoplay }
						/>
						<ToggleControl
							label={ __( 'Loop' ) }
							onChange={ this.toggleAttribute( 'loop' ) }
							checked={ loop }
						/>
						<SelectControl
							label={ __( 'Preload' ) }
							value={ undefined !== preload ? preload : 'none' }
							// `undefined` is required for the preload attribute to be unset.
							onChange={ ( value ) => setAttributes( { preload: ( 'none' !== value ) ? value : undefined } ) }
							options={ [
								{ value: 'auto', label: __( 'Auto' ) },
								{ value: 'metadata', label: __( 'Metadata' ) },
								{ value: 'none', label: __( 'None' ) },
							] }
						/>
					</PanelBody>
				</InspectorControls>
				<figure className={ className }>
					{ /*
						Disable the audio tag so the user clicking on it won't play the
						file or change the position slider when the controls are enabled.
					*/ }
					<Disabled>
						<audio controls="controls" src={ src } />
					</Disabled>
					{ ( ( caption && caption.length ) || !! isSelected ) && (
						<RichText
							tagName="figcaption"
							placeholder={ __( 'Write caption…' ) }
							value={ caption }
							onChange={ ( value ) => setAttributes( { caption: value } ) }
							inlineToolbar
						/>
					) }
				</figure>
			</Fragment>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	}
}

export default withNotices( AudioEdit );
